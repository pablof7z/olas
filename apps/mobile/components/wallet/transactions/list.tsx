import { toast } from '@backpackapp-io/react-native-toast';
import {
    useNDKWallet,
    NDKKind,
    useSubscribe,
    NDKEvent,
    NDKZapSplit,
    NDKPaymentConfirmation,
    NDKNutzap,
    useNDKCurrentUser,
    NDKFilter,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKCashuDeposit, NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import { router } from 'expo-router';
import React, { useMemo, useRef, useEffect } from 'react';
import { FlatList, View } from 'react-native';

import HistoryItem from './item';

import { Text } from '@/components/nativewindui/Text';
import { useActiveEventStore } from '@/components/wallet/store';
import { usePendingPayments } from '@/stores/payments';
export default function TransactionHistory({ wallet }: { wallet: NDKCashuWallet }) {
    const { activeWallet } = useNDKWallet();
    const currentUser = useNDKCurrentUser();

    const filters = useMemo(() => {
        if (!currentUser || !(activeWallet instanceof NDKCashuWallet)) return false;

        return [
            {
                kinds: [NDKKind.CashuWalletTx],
                authors: [currentUser.pubkey],
            },
        ];
    }, [currentUser?.pubkey, activeWallet?.walletId]);

    const { events: history } = useSubscribe(filters, { subId: 'tx-list', groupable: false, skipVerification: true }, [
        currentUser?.pubkey,
        activeWallet?.walletId,
    ]);
    const { setActiveEvent } = useActiveEventStore();
    const pendingPayments = usePendingPayments();

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

    useEffect(() => {
        for (const pendingPayment of pendingPayments) {
            if (listening.current.has(pendingPayment.internalId)) continue;
            listening.current.add(pendingPayment.internalId);

            // listen for completion of the pending zap
            // THIS DOESN'T WORK BECAUSE THE EVENT I'M RECEIVING IS THE NUTZAP, NOT THE WALLET CHANGE EVENT
            pendingPayment.zapper.once('split:complete', (split: NDKZapSplit, result: NDKPaymentConfirmation) => {
                if (result instanceof Error) {
                    toast.error(result.message);
                }
            });

            listening.current.delete(pendingPayment.internalId);
        }
    }, [pendingPayments.length]);

    const onItemPress = (item: NDKEvent) => {
        setActiveEvent(item);
        router.push('/tx');
    };

    const historyWithPendingZaps = useMemo(() => {
        return [...Array.from(pendingPayments.values()).flat(), ...history.sort((a, b) => b.created_at - a.created_at)];
    }, [history.length, pendingPayments.length]);

    return (
        <View className="flex-1">
            <FlatList
                data={historyWithPendingZaps}
                keyExtractor={(item: NDKEvent) => item.id}
                contentInsetAdjustmentBehavior="automatic"
                renderItem={({ item, index, target }) => (
                    <HistoryItem wallet={wallet} item={item} index={index} target={target} onPress={() => onItemPress(item)} />
                )}
            />
        </View>
    );
}
