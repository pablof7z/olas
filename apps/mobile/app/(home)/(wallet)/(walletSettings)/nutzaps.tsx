import { Proof } from '@cashu/cashu-ts';
import {
    DBCache,
    type NDKCacheAdapterSqlite,
    NDKEvent,
    NDKKind,
    NDKNutzap,
    useNDK,
    useNDKCurrentUser,
    useNDKNutzapMonitor,
    useNDKWallet,
    useUserProfile,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKCashuWallet, type NDKNutzapState, NdkNutzapStatus } from '@nostr-dev-kit/ndk-wallet';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import * as User from '@/components/ui/user';
import { formatMoney } from '@/utils/bitcoin';

export default function NutzapsScreen() {
    const { activeWallet } = useNDKWallet();
    const { nutzapMonitor } = useNDKNutzapMonitor();
    const { ndk } = useNDK();
    const cacheAdapter = ndk.cacheAdapter as NDKCacheAdapterSqlite;
    const nutzapStates = nutzapMonitor.nutzapStates;

    const addNutzapIfMissing = useCallback(
        (eventId: string, state: NDKNutzapState) => {
            // if (!state.nutzap) {
            const event = cacheAdapter.getEventId(eventId);
            if (event) {
                state.nutzap = new NDKNutzap(ndk, event);
            }
            // }

            return state;
        },
        [nutzapStates]
    );

    const sortedNutzaps = useMemo(() => {
        const states = Array.from(nutzapStates.entries()).map(
            ([eventId, state]) =>
                [eventId, addNutzapIfMissing(eventId, state)] as [string, NDKNutzapState]
        );

        // Sort by created_at timestamp (descending - newest first)
        return states.sort((a, b) => {
            const nutzapA = a[1].nutzap;
            const nutzapB = b[1].nutzap;

            // If either nutzap is missing, put it at the end
            if (!nutzapA) return 1;
            if (!nutzapB) return -1;

            // Sort by created_at timestamp
            return (nutzapB.created_at || 0) - (nutzapA.created_at || 0);
        });
    }, [nutzapStates, addNutzapIfMissing]);

    if (!(activeWallet instanceof NDKCashuWallet)) return null;

    return (
        <View style={{ flex: 1 }}>
            <FlashList
                data={sortedNutzaps}
                estimatedItemSize={80}
                renderItem={({ item, index, target }) => (
                    <NutzapRow
                        wallet={activeWallet}
                        state={item[1]}
                        eventId={item[0]}
                        index={index}
                        target={target}
                    />
                )}
            />
        </View>
    );
}

function NutzapRow({
    state,
    eventId,
    index,
    target,
}: { state: NDKNutzapState; eventId: string; index: number; target: any }) {
    const { ndk } = useNDK();
    const nutzap = state.nutzap;
    const status = state.status;

    const { nutzapMonitor } = useNDKNutzapMonitor();

    const claim = useCallback(async () => {
        if (!nutzap) return;
        const _res = await nutzapMonitor.redeemNutzap(nutzap);
    }, [nutzap?.id]);

    const spent = [NdkNutzapStatus.REDEEMED, NdkNutzapStatus.SPENT].includes(status);

    const { userProfile } = useUserProfile(nutzap?.pubkey);

    const handleLongPress = useCallback(() => {}, [eventId]);

    return (
        <ListItem
            index={index}
            target={target}
            leftView={
                nutzap && (
                    <User.Avatar pubkey={nutzap.pubkey} userProfile={userProfile} imageSize={24} />
                )
            }
            rightView={
                !spent && (
                    <Button size="sm" variant="secondary" onPress={claim}>
                        <Text>Redeem</Text>
                    </Button>
                )
            }
            onLongPress={handleLongPress}
            item={{
                title: status,
                subTitle: state.errorMessage,
            }}
        />
    );
}
