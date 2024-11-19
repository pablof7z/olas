import { useNDK } from '@/ndk-expo';
import { Icon, MaterialIconName } from '@roninoss/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/nativewindui/Avatar';
import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import NDK, {
    NDKEvent,
    NDKKind,
    NDKPrivateKeySigner,
    NDKRelay,
    NDKRelaySet,
    NDKRelayStatus,
    NDKSubscriptionCacheUsage,
    NDKUser,
    NostrEvent,
} from '@nostr-dev-kit/ndk';
import { walleteStore } from '@/app/stores';
import { useStore } from 'zustand';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';

const CONNECTIVITY_STATUS_COLORS: Record<NDKRelayStatus, string> = {
    [NDKRelayStatus.RECONNECTING]: '#f1c40f',
    [NDKRelayStatus.CONNECTING]: '#f1c40f',
    [NDKRelayStatus.DISCONNECTED]: '#aa4240',
    [NDKRelayStatus.DISCONNECTING]: '#aa4240',
    [NDKRelayStatus.CONNECTED]: '#e74c3c',
    [NDKRelayStatus.FLAPPING]: '#2ecc71',
    [NDKRelayStatus.AUTHENTICATING]: '#3498db',
    [NDKRelayStatus.AUTHENTICATED]: '#e74c3c',
    [NDKRelayStatus.AUTH_REQUESTED]: '#e74c3c',
} as const;

function RelayConnectivityIndicator({ relay }: { relay: NDKRelay }) {
    const color = CONNECTIVITY_STATUS_COLORS[relay.status];

    return (
        <View
            style={{
                borderRadius: 10,
                width: 8,
                height: 8,
                backgroundColor: color,
            }}></View>
    );
}

export default function RelaysScreen() {
    const { ndk } = useNDK();
    const { activeWallet } = useStore(walleteStore);
    const [searchText, setSearchText] = useState<string | null>(null);
    const [url, setUrl] = useState<string>('wss://relay.damus.io');
    const [relays, setRelays] = useState<string[]>(activeWallet?.relays ?? []);

    const data = useMemo(() => {
        if (!ndk || !activeWallet) return [];

        return relays
            .map((relay) => ({
                id: relay,
                title: relay,
                validateFn: () => {
                    validateRelay(ndk, relay);
                },
                rightView: (
                    <View className="flex-1 items-center px-4 py-2">
                        {/* <RelayConnectivityIndicator relay={ndk.pool.getRelay(relay)} /> */}
                    </View>
                ),
            }))
            .filter((item) => (searchText ?? '').trim().length === 0 || item.title.match(searchText!));
    }, [ndk?.pool.relays, relays, searchText]);

    const addFn = () => {
        try {
            const uri = new URL(url);
            if (!['wss:', 'ws:'].includes(uri.protocol)) {
                alert('Invalid protocol');
                return;
            }
            setRelays([...relays, url]);
            setUrl('');
        } catch (e) {
            alert('Invalid URL');
        }
    };

    const save = () => {
        if (!activeWallet) return;

        activeWallet.relays = relays;
        activeWallet.publish().then(() => {
            router.back();
        });
    };

    return (
        <>
            <LargeTitleHeader
                title="Relays"
                searchBar={{
                    iosHideWhenScrolling: true,
                    onChangeText: setSearchText,
                }}
                rightView={() => (
                    <View className="flex-row gap-4">
                        <TouchableOpacity onPress={save}>
                            <Text className="text-primary">Save</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                if (ndk) validateRelays(ndk);
                            }}>
                            <Text className="text-primary">Validate</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
            <List
                contentContainerClassName="pt-4"
                contentInsetAdjustmentBehavior="automatic"
                variant="insets"
                data={[...data, { id: 'add', fn: addFn, set: setUrl }]}
                estimatedItemSize={ESTIMATED_ITEM_HEIGHT.titleOnly}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                sectionHeaderAsGap
            />
        </>
    );
}

function renderItem<T extends (typeof data)[number]>(info: ListRenderItemInfo<T>) {
    if (info.item.id === 'add') {
        return (
            <ListItem
                className={cn('ios:pl-0 pl-2', info.index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
                titleClassName="text-lg"
                leftView={info.item.leftView}
                rightView={
                    <TouchableOpacity onPress={info.item.fn}>
                        <Text className="mt-2 pr-4 text-primary">Add</Text>
                    </TouchableOpacity>
                }
                {...info}>
                <TextInput
                    className="flex-1 text-lg text-foreground"
                    placeholder="Add relay"
                    onChangeText={info.item.set}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </ListItem>
        );
    } else if (typeof info.item === 'string') {
        return <ListSectionHeader {...info} />;
    }
    return (
        <ListItem
            className={cn('ios:pl-0 pl-2', info.index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
            titleClassName="text-lg"
            leftView={info.item.leftView}
            rightView={
                <View className="flex-row gap-4">
                    {/* <TouchableOpacity onPress={}>
                        <Text className="text-neutral pr-4 mt-2">
                            <Icon name="eye-outline" size={20} />
                        </Text>
                    </TouchableOpacity> */}

                    <TouchableOpacity onPress={info.item.fn}>
                        <Text className="text-neutral mt-2 pr-4">
                            <Icon name="trash-can-outline" size={20} />
                        </Text>
                    </TouchableOpacity>
                </View>
            }
            {...info}
            onPress={() => info.item.validateFn()}
        />
    );
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
    return typeof item === 'string' ? item : item.id;
}

async function validateRelays(ndk: NDK) {}

async function validateRelay(ndk: NDK, relay: string) {
    const pk = NDKPrivateKeySigner.generate();
    const relaySet = NDKRelaySet.fromRelayUrls([relay], ndk);

    const testToken = new NDKEvent(ndk, {
        kind: NDKKind.CashuToken,
    } as NostrEvent);
    await testToken.sign(pk);
    const pub = await testToken.publish(relaySet);

    if (pub.size !== 1) {
        alert("Looks like we weren't able to publish to " + relay);
    }

    // validate it was published
    const req = await ndk.fetchEvents(
        { kinds: [NDKKind.CashuToken], authors: [testToken.pubkey] },
        { cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY }
    );
    if (req.size !== 1) {
        alert('Relay ' + relay + ' returned the wrong number of tokens:' + req.size);
        return false;
    }

    // delete
    const deleteEvent = await testToken.delete(undefined, false);
    await deleteEvent.sign(pk);
    await deleteEvent.publish(relaySet);

    // validate it was deleted
    const req2 = await ndk.fetchEvents(
        { kinds: [NDKKind.CashuToken], authors: [testToken.pubkey] },
        { cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY }
    );
    if (req2.size !== 0) {
        alert('Relay ' + relay + ' returned the wrong number of tokens:' + req.size);
        return false;
    }

    return true;
}
