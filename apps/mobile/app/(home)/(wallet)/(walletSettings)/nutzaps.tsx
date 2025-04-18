import {
    // DBCache, // Removed unused import
    type NDKCacheAdapterSqlite, NDKNutzap,
    useNDK, useNDKNutzapMonitor,
    useNDKWallet,
    useProfile
} from '@nostr-dev-kit/ndk-mobile';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet'; // Removed unexported NDKNutzapState, NdkNutzapStatus
import { FlashList } from '@shopify/flash-list';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
// Define placeholder types or use 'any' if specific types are unknown
type NDKNutzapState = any; // Placeholder type
type NdkNutzapStatus = string; // Placeholder type, assuming string statuses

import { Button } from '@/components/nativewindui/Button';
import { ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import * as User from '@/components/ui/user';

export default function NutzapsScreen() {
    const { activeWallet } = useNDKWallet();
    const { nutzapMonitor } = useNDKNutzapMonitor();
    const { ndk } = useNDK();
    if (!ndk || !nutzapMonitor) {
        // Handle missing ndk or nutzapMonitor
        console.error("NDK or NutzapMonitor not available.");
        return <View><Text>Error initializing Nutzaps screen.</Text></View>;
    }
    const cacheAdapter = ndk.cacheAdapter as NDKCacheAdapterSqlite;
    const nutzapStates = nutzapMonitor.nutzapStates;

    const addNutzapIfMissing = useCallback(
        (eventId: string, state: NDKNutzapState) => {
            // if (!state.nutzap) {
            const event = cacheAdapter.getEventId(eventId);
            if (event) {
                // ndk is checked above
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
                        // wallet prop removed as NutzapRow doesn't accept it
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
    const nutzap = state.nutzap;
    const status = state.status;

    const { nutzapMonitor } = useNDKNutzapMonitor();

    const claim = useCallback(async () => {
        if (!nutzap) return;
        // nutzapMonitor is checked in the parent component
        const _res = await nutzapMonitor!.redeemNutzap(nutzap); // Use non-null assertion
    }, [nutzap?.id, nutzapMonitor]);

    // Replace NdkNutzapStatus enum with string literals
    const spent = ['REDEEMED', 'SPENT'].includes(status.toUpperCase());

    const userProfile = useProfile(nutzap?.pubkey);

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
