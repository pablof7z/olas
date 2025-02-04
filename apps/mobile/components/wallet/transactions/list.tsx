import { useActiveEventStore, useAppStateStore, ZapperWithId } from "@/components/wallet/store";
import { useNDKWallet, NDKKind, useSubscribe, NDKEvent, NDKZapSplit, NDKPaymentConfirmation, NDKNutzap, useNDKCurrentUser, NDKFilter } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuDeposit, NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import HistoryItem from "./item";
import { router } from "expo-router";
import React, { useMemo, useRef, useEffect } from "react";
import { FlatList, View } from "react-native";
import { toast } from "@backpackapp-io/react-native-toast";

export default function TransactionHistory({ wallet }: { wallet: NDKCashuWallet }) {
    const { activeWallet } = useNDKWallet();
    const currentUser = useNDKCurrentUser();

    const filters = useMemo(() => {
        if (!currentUser || !(activeWallet instanceof NDKCashuWallet)) return false;

        return [{
            kinds: [NDKKind.WalletChange],
            authors: [currentUser.pubkey],
            ...activeWallet.event.filter()
        }];
    }, [ currentUser?.pubkey, activeWallet?.walletId])

    const { events: history} = useSubscribe(
        filters,
        { subId: 'tx-list', groupable: false },
        [currentUser?.pubkey, activeWallet?.walletId]
    );
    const { setActiveEvent } = useActiveEventStore();
    const { pendingPayments } = useAppStateStore();

    /**
     * This two variables provide a way to generate a stable id when a pending zap completes;
     * the way it works is, when a pending zap is found, we listen for completion until we get it's
     * ID. Once we get the event ID, we put event ID as the key of the completedPendingZaps map, and
     * the value of the pending zap ID as the value.
     * 
     * This way, when we generate IDs in the FlashList, we can check if this event ID is in the completedPendingZaps map,
     * and use that ID instead of the event ID.
     */
    const listening = useRef(new Set<string>());
    const completedPendingZaps = useRef(new Map<string, string>());

    useEffect(() => {
        for (const payment of pendingPayments) {
            if (listening.current.has(payment.internalId)) continue;
            listening.current.add(payment.internalId);

            // listen for completion of the pending zap
            // THIS DOESN'T WORK BECAUSE THE EVENT I'M RECEIVING IS THE NUTZAP, NOT THE WALLET CHANGE EVENT
            payment.zapper.once('split:complete', (split: NDKZapSplit, result: NDKPaymentConfirmation) => {
                console.log('received a split:complete event', {
                    temporaryId: payment.internalId,
                    result
                })

                if (result instanceof NDKNutzap) {
                    console.log('marking permanent ID so it is mapped to temporary ID', {
                        permanentId: result.id,
                        temporaryId: payment.internalId
                    })
                    completedPendingZaps.current.set(result.id, payment.internalId);
                } else if (result instanceof Error) {
                    toast.error(result.message);
                }
            });

            listening.current.delete(payment.internalId);
        }
    }, [pendingPayments.length]);

    const onItemPress = (item: NDKEvent) => {
        setActiveEvent(item);
        router.push('/tx');
    }

    const sortedHistory = useMemo(() => {
        return history.sort((a, b) => b.created_at - a.created_at)
    }, [history.length]);

    // const historyWithPendingZaps = useMemo(() => {
    //     return [
    //         ...pendingPayments,
    //         ...history.sort((a, b) => b.created_at - a.created_at)
    //     ]
    // }, [history.length, pendingPayments.length]);

    return (
        <View className="flex-1">
            {/* <Text className="text-white">{sortedHistory.length}</Text> */}
            <FlatList
                data={sortedHistory}
                keyExtractor={(item: NDKEvent) => item.id}
                contentInsetAdjustmentBehavior="automatic"
                renderItem={({ item, index, target }) => (
                    <HistoryItem
                        wallet={wallet}
                        item={item}
                        index={index}
                        target={target}
                        onPress={() => onItemPress(item)}
                    />
                )}
            />
        </View>
    )
}