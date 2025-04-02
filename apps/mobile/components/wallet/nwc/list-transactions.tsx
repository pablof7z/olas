import { useNDK, useNDKCurrentUser, useNDKWallet, useProfile } from '@nostr-dev-kit/ndk-mobile'; // Import useNDKCurrentUser
import { type NDKNWCTransaction, NDKNWCWallet } from '@nostr-dev-kit/ndk-wallet';
import { FlashList } from '@shopify/flash-list';
import { ArrowDown, ArrowUp, Timer } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { Counterparty } from '../transactions/counterparty';
import { ItemRightColumn } from '../transactions/item-right-column';

import { ListItem } from '@/components/nativewindui/List';
import RelativeTime from '@/components/relative-time';
import * as User from '@/components/ui/user';
import { cn } from '@/lib/cn';
import { useColorScheme } from '@/lib/useColorScheme';
import { getNWCZap, getNWCZapsByPendingPaymentId } from '@/stores/db/zaps';
import { type Payment, usePendingPayments } from '@/stores/payments'; // Ensure Payment is imported

export default function NWCListTansactions() {
    const { activeWallet } = useNDKWallet();
    const [txs, setTxs] = useState<NDKNWCTransaction[]>([]);
    const fetchRef = useRef<NodeJS.Timeout | null>(null);

    const fetchTransactions = useCallback(() => {
        if (!(activeWallet instanceof NDKNWCWallet)) return;
        if (fetchRef.current) clearTimeout(fetchRef.current);
        fetchRef.current = setTimeout(() => {
            activeWallet.listTransactions().then(({ transactions }) => {
                setTxs(transactions);
            });
        }, 500);
    }, [activeWallet?.walletId]);

    useEffect(() => {
        fetchTransactions();
        activeWallet?.on('balance_updated', fetchTransactions); // Optional chaining

        return () => {
            activeWallet?.off('balance_updated', fetchTransactions); // Optional chaining
        };
    }, [fetchTransactions]);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        const timeout = setTimeout(() => {
             console.log("Refresh timeout reached");
             setRefreshing(false);
        }, 6000);

        // Check activeWallet before calling updateBalance
        if (activeWallet) {
            // Explicitly cast activeWallet to NDKNWCWallet before calling method
            (activeWallet as NDKNWCWallet).updateBalance()
                .then(() => {
                    console.log("Balance updated successfully");
                })
                .catch((err: any) => {
                    console.error('Error updating balance:', err);
                })
                .finally(() => {
                    console.log("Update balance finally block");
                    fetchTransactions();
                    setRefreshing(false);
                    clearTimeout(timeout);
                });
        } else {
            console.error("Cannot refresh balance: activeWallet is null.");
            setRefreshing(false);
            clearTimeout(timeout);
        }
    }, [activeWallet, fetchTransactions]);

    const pendingPayments = usePendingPayments();

    const txsWithPendingPayments = useMemo(() => {
        // go through the pending payments and see if we find a
        const notFoundPendingPayments = [];
        for (const pendingPayment of pendingPayments) {
            const nwcZap = getNWCZapsByPendingPaymentId(pendingPayment.internalId);
            if (!nwcZap) {
                notFoundPendingPayments.push(pendingPayment);
            }
        }

        // Add types for sort callback
        return [...notFoundPendingPayments, ...txs.sort((a: NDKNWCTransaction, b: NDKNWCTransaction) => (b.created_at ?? 0) - (a.created_at ?? 0))];
    }, [txs, pendingPayments.length]);

    return (
        <FlashList
            data={txsWithPendingPayments}
            renderItem={({ item, index, target }) => (
                <Item item={item} index={index} target={target} onPress={() => {}} />
            )}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
    );
}

function Item({
    item,
    index,
    target,
    onPress,
}: { item: Payment | NDKNWCTransaction; index: number; target: any; onPress: () => void }) {
    const currentUser = useNDKCurrentUser(); // Get current user
    const { recipientPubkey, amount, type, createdAt } = useMemo(() => {
        let recipientPubkey = null;
        let amount = null;
        let createdAt = null;
        let type: 'incoming' | 'outgoing' = 'outgoing'; // Change const to let

        // Check if item is NDKNWCTransaction (has invoice) or Payment (has internalId)
        if ('invoice' in item && item.invoice !== undefined) { // Check if item is NDKNWCTransaction
            const tx = item as NDKNWCTransaction;
            // Ensure tx.invoice is defined before calling
            const zapInfo = tx.invoice ? getNWCZap(tx.invoice) : null;
            if (zapInfo) {
                recipientPubkey = zapInfo.recipient_pubkey;
            } else {
            }
            createdAt = tx.created_at;
            amount = tx.amount;
        } else {
            // Item is Payment (or NDKNWCTransaction without invoice)
            const payment = item as Payment; // Assert as Payment if not NDKNWCTransaction with invoice
            recipientPubkey = payment.recipient;
            amount = payment.amount;
            createdAt = payment.created_at;
            // Determine type based on status if possible, default to outgoing
            // Use activeWallet obtained from useNDKWallet hook
            // Compare payment sender with current user's pubkey
            type = (payment.status === 'confirmed' && currentUser && payment.sender !== currentUser.pubkey) ? 'incoming' : 'outgoing';
        }

        return { recipientPubkey, amount, createdAt, type };
    }, [item, currentUser]); // Add currentUser to useMemo dependencies

    // Check if item is Payment and has status 'pending' or 'delayed'
    const isPending = 'status' in item && (item.status === 'pending' || item.status === 'delayed'); // Check if item is Payment and pending/delayed

    return (
        <ListItem
            className={cn(
                '!bg-transparent px-2',
                index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
            )}
            target={target}
            leftView={<LeftView direction={type} pubkey={recipientPubkey ?? undefined} />}
            rightView={<ItemRightColumn amount={amount ?? 0} unit="msats" isPending={isPending} />}
            index={index}
            onPress={onPress}
            // Construct the item prop for ListItem
            item={{
                title: recipientPubkey ? '' : (isPending ? 'Pending Zap' : 'Transaction'), // Title handled by Counterparty or default
                subTitle: isPending ? 'Sending...' : undefined
            }}
        >
            {recipientPubkey ? (
                <Counterparty pubkey={recipientPubkey} timestamp={createdAt ?? 0} />
            ) : (
                <RelativeTime className="text-xs text-muted-foreground" timestamp={createdAt ?? 0} />
            )}
        </ListItem>
    );
}

const LeftView = ({
    direction,
    pubkey,
}: { direction: 'incoming' | 'outgoing'; pubkey?: string }) => {
    const userProfile = useProfile(pubkey);
    const { colors } = useColorScheme();

    const color = colors.primary;

    if (pubkey && userProfile) {
        return (
            <View className="relative flex-row items-center gap-2" style={{ marginRight: 10 }}>
                {userProfile && (
                    <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={48} />
                )}
                {direction === 'outgoing' && (
                    <View className="absolute -right-2 -top-2 rotate-45">
                        <ArrowUp size={18} color={color} />
                    </View>
                )}
                {direction === 'incoming' && (
                    <View className="absolute -bottom-2 -right-2 -rotate-45">
                        <ArrowDown size={18} color={color} />
                    </View>
                )}
            </View>
        );
    }

    return (
        <View className="mr-2 flex-row items-center gap-2">
            {direction === 'outgoing' ? (
                <ArrowUp size={24} color={color} />
            ) : (
                <ArrowDown size={24} color={color} />
            )}
        </View>
    );
};
