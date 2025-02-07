import { toast } from '@backpackapp-io/react-native-toast';
import { NDKEvent, NDKFilter, NDKKind, NDKPaymentConfirmation, NDKUser, NDKZapper, NDKZapSplit } from '@nostr-dev-kit/ndk-mobile';
import { create } from 'zustand';

export type PendingZap = { zapper: NDKZapper, internalId: string }

type PaymentStore = {
    pendingPayments: Map<string, PendingZap[]>;
}

type PaymentActions = {
    addPendingPayment: (zapper: NDKZapper) => PendingZap;
}

/**
 * This store tracks outgoing payments so that we can provide
 * a good, immediate experience when the user sends a payment.
 */
export const usePaymentStore = create<PaymentStore & PaymentActions>((set, get) => ({
    pendingPayments: new Map(),
    addPendingPayment(zapper: NDKZapper): PendingZap {
        const pendingZap: PendingZap = {
            zapper,
            internalId: Math.random().toString(),
        }

        const removeZap = () => {
            set((state) => {
                const val = new Map(state.pendingPayments);
                const id = getZapperTargetId(zapper);
                let curr = val.get(id) || [];
                curr = curr.filter(p => p.internalId !== pendingZap.internalId);
                if (curr.length > 0) val.set(id, curr)
                else val.delete(id);
                return { pendingPayments: val };
            });
        }

        zapper.once('complete', (results: Map<NDKZapSplit, NDKPaymentConfirmation | Error | undefined>) => {
            console.log('complete', Array.from(results.values()))
            const error = Array.from(results.values()).find((result) => result instanceof Error)
            if (error) {
                toast.error(error.message);
            }
            
            removeZap();
        });

        set((state) => {
            const copy = new Map(state.pendingPayments);
            const id = getZapperTargetId(zapper);
            const pending = copy.get(id) || [];
            pending.push(pendingZap);
            copy.set(id, pending);
            return { pendingPayments: copy }
        });

        waitForZap(zapper)
            .then(() => removeZap());

        return pendingZap;
    }
}));

function getZapperTargetId(zapper: NDKZapper) {
    const { target } = zapper;
    if (target instanceof NDKUser) return target.pubkey;
    if (target instanceof NDKEvent) return target.tagId();
    throw "Unexpected target id type";
}

async function waitForZap(zapper: NDKZapper) {
    const { ndk } = zapper;
    const user = ndk.activeUser;

    if (!user) throw "active user not set in NDK"
    
    let filters: NDKFilter[] = [
        { kinds: [NDKKind.Zap], "#P": [user.pubkey], ...zapper.target.filter() },
        { kinds: [NDKKind.Nutzap], authors: [user.pubkey], ...zapper.target.filter() },
    ]

    console.log("waiting for zap event")

    return new Promise((resolve) => {
        const sub = ndk.subscribe(filters)
        sub.on("event", resolve)
    });
}