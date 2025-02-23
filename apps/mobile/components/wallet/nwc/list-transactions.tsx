import { useNDK, useNDKWallet, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { NDKNWCTransaction, NDKNWCWallet } from "@nostr-dev-kit/ndk-wallet";
import { RefreshControl, StyleSheet, View } from "react-native";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { FlashList } from "@shopify/flash-list";
import { ListItem } from "@/components/nativewindui/List";
import { cn } from "@/lib/cn";
import { ArrowDown, ArrowUp, Timer } from "lucide-react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import * as User from "@/components/ui/user";
import RelativeTime from "@/app/components/relative-time";
import { getNWCZap, getNWCZapsByPendingPaymentId } from "@/stores/db/zaps";
import { PendingZap, usePendingPayments } from "@/stores/payments";
import { ItemRightColumn } from "../transactions/item-right-column";
import { Counterparty } from "../transactions/counterparty";

export default function NWCListTansactions() {
    const { activeWallet } = useNDKWallet();
    const [txs, setTxs] = useState<NDKNWCTransaction[]>([]);
    const fetchRef = useRef<NodeJS.Timeout | null>(null);

    const fetchTransactions = useCallback(() => {
        if (!(activeWallet instanceof NDKNWCWallet)) return;
        if (fetchRef.current) clearTimeout(fetchRef.current);
        fetchRef.current = setTimeout(() => {
            activeWallet.listTransactions().then(({transactions}) => {
                console.log('list transactions returned ', transactions.length, 'txs');
                setTxs(transactions);
            });
        }, 500);
    }, [activeWallet?.walletId])

    useEffect(() => {
        fetchTransactions();
        activeWallet.on('balance_updated', fetchTransactions);

        return () => {
            activeWallet.off('balance_updated', fetchTransactions);
        }
    }, [fetchTransactions])

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        const timeout = setTimeout(() => setRefreshing(false), 6000);
        activeWallet?.updateBalance()
            .then(() => {
                console.log('balance updated');
            })
            .catch((err) => {
                console.error('error updating balance', err);
            })
            .finally(() => {
                fetchTransactions();
                setRefreshing(false);
                clearTimeout(timeout);
            })
    }, [activeWallet?.walletId])

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
        
        return [
            ...notFoundPendingPayments,
            ...txs.sort((a, b) => b.created_at - a.created_at)
        ]
    }, [txs, pendingPayments.length]);

    return <FlashList
        data={txsWithPendingPayments}
        renderItem={({ item, index, target }) => <Item item={item} index={index} target={target} onPress={() => { }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
}

function Item({ item, index, target, onPress }: { item: PendingZap | NDKNWCTransaction, index: number, target: any, onPress: () => void }) {
    const { recipientPubkey, amount, type, createdAt } = useMemo(() => {
        let recipientPubkey = null; 
        let amount = null;
        let createdAt = null;
        let type: 'incoming' | 'outgoing' = "outgoing";
        
        if ((item as NDKNWCTransaction).invoice) {
            const tx = item as NDKNWCTransaction;
            const zapInfo = getNWCZap(tx.invoice);
            if (zapInfo) {
                recipientPubkey = zapInfo.recipient_pubkey;
            } else {
            }
            createdAt = tx.created_at;
            amount = tx.amount;
        } else {
            const { zapper, internalId } = item as PendingZap;
            recipientPubkey = zapper.target.pubkey;
            amount = zapper.amount;
            createdAt = Date.now()/1000;
        }

        return { recipientPubkey, amount, createdAt, type };
    }, [item])

    const isPending = !!(item as PendingZap).internalId;
    
    return (
        <ListItem
            className={cn('px-2 !bg-transparent', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
            target={target}
            leftView={<LeftView direction={type} pubkey={recipientPubkey} />}
            rightView={<ItemRightColumn amount={amount} unit={"msats"} isPending={isPending} />}
            index={index}
            onPress={onPress}
            item={{}}
        >
            {recipientPubkey ? (
                <Counterparty pubkey={recipientPubkey} timestamp={createdAt} />
            ) : (
                <RelativeTime className="text-xs text-muted-foreground" timestamp={createdAt} />
            )}
        </ListItem>  
    )
}

const LeftView = ({ direction, pubkey }: { direction: 'incoming' | 'outgoing', pubkey?: string }) => {
    const { userProfile } = useUserProfile(pubkey);
    const { colors } = useColorScheme();

    const color = colors.primary;

    if (pubkey && userProfile) {
        return (
            <View className="flex-row items-center gap-2 relative" style={{ marginRight: 10}}>
                {userProfile && <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={48} />}
                {direction === 'outgoing' && (
                    <View className="absolute -right-2 -top-2 rotate-45">
                        <ArrowUp size={18} color={color} />
                    </View>
                )}
                {direction === 'incoming' && (
                    <View className="absolute -right-2 -bottom-2 -rotate-45">
                        <ArrowDown size={18} color={color} />
                    </View>
                )}
            </View>
        )
    }
    
    return (
        <View className="flex-row items-center gap-2 mr-2">
            {direction === 'outgoing' ? <ArrowUp size={24} color={color} /> : <ArrowDown size={24} color={color} />}
        </View>
    )
}
