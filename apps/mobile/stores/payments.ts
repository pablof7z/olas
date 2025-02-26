import { db } from '@/stores/db';
import { amountInSats } from '@/utils/bitcoin';
import { Hexpubkey, NDKEvent, NDKKind, NDKNutzap, NDKPaymentConfirmation, NDKUser, NDKZapInvoice, NDKZapper, NDKZapSplit, zapInvoiceFromEvent } from '@nostr-dev-kit/ndk-mobile';
import { create } from 'zustand';
import { useMemo } from 'react';

const PaymentKinds = new Set([ NDKKind.Nutzap, NDKKind.Zap ]);
const isPaymentEvent = (event: NDKEvent) => PaymentKinds.has(event.kind);

let buffer: Payment[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

type PaymentRecord = {
    internal_id: string;
    target_type: 'user' | 'event';
    target_id: string;
    recipient: string;
    sender: string;
    comment: string;
    amount: number;
    unit: string;
    status: string;
    created_at: number;
    receipt_id: string;
}

const flushBuffer = () => {
    if (buffer.length === 0) return;
    
    const placeholders = buffer.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
    const params = buffer.flatMap(payment => [
        payment.internalId,
        payment.targetType,
        payment.targetId,
        payment.recipient,
        payment.sender,
        payment.comment,
        payment.amount,
        payment.unit,
        payment.status,
        payment.created_at,
        payment.receipt?.id
    ]);

    db.runSync(`INSERT INTO payments (internal_id, target_type, target_id, recipient, sender, comment, amount, unit, status, created_at, receipt_id) VALUES ${placeholders};`, params);
    buffer = [];
};

const recordNewPayment = (payment: Payment) => {
    buffer.push(payment);
    if (!flushTimeout) flushTimeout = setTimeout(flushBuffer, 2000);
};

/**
 * The status of a payment.
 * 
 * - delayed: The payment will be sent later.
 * - pending: The payment is pending.
 * - complete: The payment is complete.
 * - confirmed: The payment event has been seen.
 * - failed: The payment failed.
 */
type PaymentStatus = 'delayed' | 'pending' | 'complete' | 'confirmed' | 'failed';

export type Payment = {
    internalId: string;
    targetType: 'user' | 'event';
    targetId: string;
    target?: NDKUser | NDKEvent;
    recipient: string;
    sender: Hexpubkey;
    zapper?: NDKZapper;
    comment?: string;
    amount: number;
    unit: string;
    status: PaymentStatus;
    error?: string;
    created_at: number;
    receipt?: NDKEvent; // Either a kind:9321 or a kind:9735
    receiptId?: string;
}

type PaymentStore = {
    entries: Map<string, PaymentEntry>;
    currentUser?: Hexpubkey;
}

type PaymentEntry = {
    payments: Payment[];
    amount: number;
    zapCountByCurrentUser: number;
}

type PaymentActions = {
    init: (currentUser?: Hexpubkey) => void;
    
    setCurrentUser: (pubkey: Hexpubkey) => void;
    
    addPendingPayment: (zapper: NDKZapper, sender: Hexpubkey, state?: 'delayed' | 'pending') => Payment[];
    updatePaymentStatus: (target: NDKUser | NDKEvent, internalId: string, status: PaymentStatus) => void;
    
    addPayments: (events: NDKEvent[], recordInDb?: boolean) => void;

    removePayment: (target: NDKUser | NDKEvent, internalId: string) => void;
}

export function targetToId(target: NDKUser | NDKEvent) {
    if (target instanceof NDKUser) return target.pubkey;
    if (target instanceof NDKEvent) return target.tagId();
    throw new Error('Invalid target');
}

const randomId = () => Math.random().toString(36).substring(2, 15);
const isPendingPayment = (payment: Payment) => payment.status === 'pending';
const isSameSender = (payment: Payment, event: NDKEvent, decodedZapReceipt?: NDKZapInvoice) => {
    if (decodedZapReceipt) return decodedZapReceipt.zappee === payment.sender;
    if (event.pubkey === payment.sender) return true;
    return false;
}

const knownEventIds = new Set<string>();

function mapDbRecord(record: PaymentRecord) {
    return {
        targetType: record.target_type,
        targetId: record.target_id,
        internalId: record.internal_id,
        recipient: record.recipient,
        sender: record.sender,
        comment: record.comment,
        amount: record.amount,
        unit: record.unit,
        status: record.status as PaymentStatus,
        created_at: record.created_at,
        receiptId: record.receipt_id,
    }
}

/**
 * This store tracks all payments we have seen or that are pending or that have failed.
 */
export const usePaymentStore = create<PaymentStore & PaymentActions>((set, get) => ({
    entries: new Map(),

    init: (currentUser?: Hexpubkey) => {
        const payments = db.getAllSync('SELECT * FROM payments') as PaymentRecord[];

        const _entries = new Map<string, PaymentEntry>();
        for (const _payment of payments) {
            const payment = mapDbRecord(_payment);
            const targetId = payment.targetId;
            if (!targetId) {
                console.log('payment has no target id', JSON.stringify(payment, null, 4));
                continue;
            }
            const entry = _entries.get(targetId) || { payments: [], amount: 0, zapCountByCurrentUser: 0 };
            entry.payments.push(payment);
            if (payment.sender === currentUser) entry.zapCountByCurrentUser++;
            entry.amount += payment.amount;
            _entries.set(targetId, entry);
        }
        
        return {
            entries: _entries,
            currentUser
        }
    },

    setCurrentUser: (pubkey: Hexpubkey) => set({ currentUser: pubkey }),

    updatePaymentStatus: (target: NDKUser | NDKEvent, internalId: string, status: PaymentStatus) => {
        set((state) => {
            const targetId = targetToId(target);
            const _entries = new Map(state.entries);
            const entry = _entries.get(targetId);
            if (!entry) return;

            const payment = entry.payments.find(p => p.internalId === internalId);
            if (!payment) return;

            console.log('updated payment status from ', payment.status, 'to', status);
            payment.status = status;
            return { entries: _entries };
        });
    },

    addPendingPayment: (zapper: NDKZapper, sender: Hexpubkey, status?: 'delayed' | 'pending') => {
        const splits = zapper.getZapSplits();
        const { id: targetId, type: targetType } = getZapperTarget(zapper);
        let pendingPayments: Payment[] = [];

        set((state) => {
            const _entries = new Map(state.entries);
            let { payments, amount, zapCountByCurrentUser } = _entries.get(targetId) || { payments: [], amount: 0, zapCountByCurrentUser: 0 };

            for (const split of splits) {
                const internalId = randomId();
                const pendingPayment: Payment = {
                    internalId,
                    targetId,
                    targetType,
                    target: zapper.target,
                    recipient: split.pubkey,
                    zapper,
                    sender,
                    comment: zapper.comment,
                    amount: amountInSats({ amount: split.amount, unit: zapper.unit ?? 'sat' }),
                    unit: 'sat',
                    status: status ?? 'pending',
                    created_at: Math.floor(Date.now() / 1000)
                }

                // store payment
                pendingPayments.push(pendingPayment);
                payments.push(pendingPayment);

                // store zapped amount
                amount += amountInSats({ amount: pendingPayment.amount, unit: pendingPayment.unit });

                // set flag
                zapCountByCurrentUser++;
                _entries.set(targetId, { payments, amount, zapCountByCurrentUser });
            }

            return { entries: _entries };
        });

        // hook to zapper events
        zapper.on('complete', (results: Map<NDKZapSplit, NDKPaymentConfirmation | Error | undefined>) => {
            const _entries = new Map(get().entries);
            
            for (const [split, result] of results.entries()) {
                const { id: targetId, type: targetType } = getZapperTarget(zapper);
                let { payments, amount, zapCountByCurrentUser } = _entries.get(targetId) || { payments: [], amount: 0, zapCountByCurrentUser: 0 };
                const paymentIndex = payments
                    .filter(isPendingPayment)
                    .findIndex(p => p.recipient === split.pubkey);
                if (paymentIndex === -1) return;
                const payment = payments[paymentIndex];

                if (result instanceof Error) {
                    payment.status = 'failed';
                    payment.error = result.message;
                    zapCountByCurrentUser--;
                    amount -= payment.amount;

                } else {
                    payment.status = 'complete';
                }
                
                payments[paymentIndex] = payment;
                _entries.set(targetId, { payments, amount, zapCountByCurrentUser });
            }

            set({ entries: _entries });
        });

        return pendingPayments;
    },

    addPayments: (events: NDKEvent[], recordInDb = true) => {
        const paymentEvents = events.filter(isPaymentEvent);

        if (!paymentEvents.length) return;
        
        set((state) => {    
            const _entries = new Map(state.entries);

            for (const event of paymentEvents) {
                if (knownEventIds.has(event.id)) continue;
                knownEventIds.add(event.id);

                let newAmount: number;
                let unit: string;
                let decodedZapReceipt: NDKZapInvoice;
                let sender: Hexpubkey;

                if (event.kind === NDKKind.Zap) {
                    decodedZapReceipt = zapInvoiceFromEvent(event);
                    if (!decodedZapReceipt) {
                        console.log("[NEW PAYMENT STORE] Unable to decode zap receipt for event", JSON.stringify(event.rawEvent(), null, 4));
                        continue;
                    }
                    newAmount = decodedZapReceipt.amount / 1000;
                    unit = "sats";
                    sender = decodedZapReceipt.zappee;
                } else if (event.kind === NDKKind.Nutzap) {
                    const zap = (event instanceof NDKNutzap) ? event : NDKNutzap.from(event);
                    if (!zap) continue;

                    newAmount = amountInSats({ amount: zap.amount, unit: zap.unit ?? "sat" });
                    unit = "sats";
                    sender = zap.pubkey;
                }
                
                const target = getTarget(event);
                if (!target) {
                    console.log("[NEW PAYMENT STORE] Unable to find target id for event", JSON.stringify(event.rawEvent(), null, 4));
                    continue;
                }

                const findPendingPayment = (payments: Payment[], event: NDKEvent, decodedZapReceipt?: NDKZapInvoice) => {
                    const recipient = event.tagValue('p');
                    if (!recipient) return null;
                    return payments
                        .filter(isPendingPayment)
                        .filter(payment => isSameSender(payment, event, decodedZapReceipt))
                        .filter(payment => payment.recipient === recipient)
                        ?.[0];
                }

                // look for a pending payment for this target
                let { payments, amount: totalAmount, zapCountByCurrentUser } = _entries.get(target.id) || { payments: [], amount: 0, zapCountByCurrentUser: 0 };
                const matchingPendingPayment = findPendingPayment(payments, event, decodedZapReceipt);
                
                // if its a matching pending payment, update the payment in the array and set the status to confirmed
                if (matchingPendingPayment) {
                    const paymentEntry = matchingPendingPayment;
                    paymentEntry.receipt = event;
                    paymentEntry.status = 'confirmed';
                } else {
                    // it's a new payment
                    const paymentEntry: Payment = {
                        internalId: randomId(),
                        targetId: target.id,
                        targetType: target.type,
                        target: event,
                        recipient: decodedZapReceipt?.zapped ?? event.tagValue('p'),
                        sender,
                        comment: decodedZapReceipt?.comment ?? event.content,
                        amount: newAmount,
                        unit,
                        status: 'confirmed',
                        created_at: event.created_at,
                        receipt: event
                    }
                    // console.log('adding new payment', JSON.stringify(paymentEntry, null, 4));
                    payments.push(paymentEntry);

                    totalAmount += newAmount;
                    
                    if (sender === get().currentUser) zapCountByCurrentUser++;

                    _entries.set(target.id, { payments, amount: totalAmount, zapCountByCurrentUser });
                    if (recordInDb) recordNewPayment(paymentEntry);
                }
            }

            return { entries: _entries };
        });
    },

    removePayment: (target: NDKUser | NDKEvent, internalId: string) => {
        set((state) => {
            const targetId = targetToId(target);
            const _entries = new Map(state.entries);
            const entry = _entries.get(targetId);
            if (!entry) return;

            const newPayments = entry.payments.filter(p => p.internalId !== internalId);
            if (newPayments.length === 0) {
                _entries.delete(targetToId(target));
            } else {
                _entries.set(targetId, {
                    payments: newPayments,
                    amount: newPayments.reduce((acc, p) => acc + p.amount, 0),
                    zapCountByCurrentUser: newPayments.filter(p => p.sender === state.currentUser).length
                });
            }

            return { entries: _entries };
        });
    }
}));

export type PendingZap = { zapper: NDKZapper, internalId: string }

function getTarget(event: NDKEvent): { id: string, type: 'user' | 'event' } | null {
    let type: 'user' | 'event' = 'event';
    let id = event.tags.find(t => ['a', 'e'].includes(t[0]))?.[1];
    if (!id) {
        id = event.tags.find(t => t[0] === 'p')?.[1];
        type = 'user';
    }
    if (!id) return null;
    return { id, type };
}

function getZapperTarget(zapper: NDKZapper): { id: string, type: 'user' | 'event' } {
    const { target } = zapper;
    if (target instanceof NDKUser) return { id: target.pubkey, type: 'user' };
    if (target instanceof NDKEvent) return { id: target.tagId(), type: 'event' };
    throw "Unexpected target id type";
}

export function useZapAmount(target: NDKUser | NDKEvent) {
    const id = targetToId(target);
    const amount = usePaymentStore(s => s.entries.get(id)?.amount);
    return amount ?? 0;
}

export function useIsZappedByUser(target: NDKUser | NDKEvent) {
    const id = targetToId(target);
    const zapCount = usePaymentStore(s => s.entries.get(id)?.zapCountByCurrentUser);
    return zapCount ? zapCount > 0 : false;
}

export function usePendingPayments() {
    const entries = usePaymentStore(s => s.entries);
    const pendingPayments = useMemo(() => {
        return Array.from(entries.values()).flatMap(e => e.payments).filter(isPendingPayment)
            .sort((a, b) => b.created_at - a.created_at);
    }, [entries]);
    return pendingPayments;
}