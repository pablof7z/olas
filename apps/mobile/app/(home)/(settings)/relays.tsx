import { NDKKind, NDKList, useNDK, useNDKSessionEventKind } from '@nostr-dev-kit/ndk-mobile';
import { Icon } from '@roninoss/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { NDKRelay, NDKRelayStatus } from '@nostr-dev-kit/ndk-mobile';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { router, usePathname } from 'expo-router';
import { Button } from '@/components/nativewindui/Button';
import { SegmentedControl } from '@/components/nativewindui/SegmentedControl';
import { getRelays, RelayEntry, setRelays } from '@/stores/db/relays';
import { DotSquare, DotSquareIcon, MoreHorizontal, Settings } from 'lucide-react-native';
import { colors } from 'react-native-keyboard-controller/lib/typescript/components/KeyboardToolbar/colors';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { atom, useAtom } from 'jotai';

const relaySettingAtom = atom<Map<string, boolean>, [Map<string, boolean>], void>(new Map(), (get, set, value) => {
    set(relaySettingAtom, value);
});

const CONNECTIVITY_STATUS_COLORS: Record<NDKRelayStatus, string> = {
    [NDKRelayStatus.RECONNECTING]: '#f1c40f',
    [NDKRelayStatus.CONNECTING]: '#f1c40f',
    [NDKRelayStatus.DISCONNECTED]: '#aa4240',
    [NDKRelayStatus.DISCONNECTING]: '#aa4240',
    [NDKRelayStatus.CONNECTED]: '#66cc66',
    [NDKRelayStatus.FLAPPING]: '#2ecc71',
    [NDKRelayStatus.AUTHENTICATING]: '#3498db',
    [NDKRelayStatus.AUTHENTICATED]: '#e74c3c',
    [NDKRelayStatus.AUTH_REQUESTED]: '#e74c3c',
} as const;

function RelayConnectivityIndicator({ relay }: { relay: NDKRelay }) {
    const color = CONNECTIVITY_STATUS_COLORS[relay.status];

    return (
        <Pressable
            onPress={() => {
                console.log('connect to', relay.url);
                relay
                    .connect()
                    .then(() => {
                        console.log('connected');
                    })
                    .catch((e) => {
                        console.error(e);
                    });
            }}
            style={{
                borderRadius: 10,
                width: 8,
                height: 8,
                backgroundColor: color,
            }}
        />
    );
}

export default function RelaysScreen() {
    const { ndk } = useNDK();
    const [searchText, setSearchText] = useState<string | null>(null);
    const [url, setUrl] = useState('');
    const [selectedPoolIndex, setSelectedPoolIndex] = useState(0);
    const [lastActionAt, setLastActionAt] = useState(0);
    const [relaySetting, setRelaySetting] = useAtom(relaySettingAtom);
    const pathname = usePathname();

    useEffect(() => {
        console.log('setting relay setting', pathname, getRelays());
        const map = new Map<string, boolean>();
        for (const relayEntry of getRelays()) {
            if (relayEntry.connect) {
                map.set(relayEntry.url, true);
            } else {
                map.set(relayEntry.url, false);
            }
        }
        console.log('map', map);
        setRelaySetting(map);
    }, [ pathname === '/(home)/(settings)/relays' ]);
    
    const autoConnectRelays = useMemo(() => {
        return new Set(Array.from(relaySetting.entries()).filter(([_, connect]) => connect).map(([url]) => url));
    }, [relaySetting]);

    const blacklistedRelays = useMemo(() => {
        return new Set(Array.from(relaySetting.entries()).filter(([_, connect]) => !connect).map(([url]) => url));
    }, [relaySetting]);

    const pools = ndk.pools;

    const relays = useMemo(() => {
        const pool = pools[selectedPoolIndex];
        return Array.from(pool.relays.values());
    }, [selectedPoolIndex, lastActionAt])

    useEffect(() => {
        ndk.pool.on('relay:connect', () => setLastActionAt(Date.now()));
        ndk.pool.on('relay:disconnect', () => setLastActionAt(Date.now()));
        ndk.pool.on('relay:connecting', () => setLastActionAt(Date.now()));
    }, []);

    const addFn = () => {
        console.log({ url });
        try {
            const uri = new URL(url);
            if (!['wss:', 'ws:'].includes(uri.protocol)) {
                alert('Invalid protocol');
                return;
            }
            const relay = ndk?.addExplicitRelay(url);
            if (relay) {
                const state = new Map(relaySetting);
                state.set(relay.url, true);
                setRelaySetting(state);
            }
            setUrl('');
        } catch (e) {
            alert('Invalid URL');
        }
    };

    useEffect(() => {
        const allRelays = new Map<string, NDKRelay>();
        const pool = pools[selectedPoolIndex];
        pool.relays.forEach((r) => allRelays.set(r.url, r));
        relays.forEach((r) => {
            if (!allRelays.has(r.url)) allRelays.set(r.url, r);
        });
    }, [ndk?.pool.relays, selectedPoolIndex]);

    const data = useMemo(() => {
        if (!ndk) return [];
        const ret = [];
        
        ret.push(...Array.from(relays.values())
            .map((relay: NDKRelay) => ({
                id: relay.url,
                title: relay.url,
                isAutoConnect: relaySetting.get(relay.url) === true,
                isBlacklisted: relaySetting.get(relay.url) === false,
                rightView: (
                    <RightView relay={relay} relayUrl={relay.url} />
                ),
                onPress: () => {
                    router.push(`/(home)/(settings)/relay?relayUrl=${relay.url}`);
                },
            }))
            .filter((item) => (searchText ?? '').trim().length === 0 || item.title.match(searchText!)));
        
        for (const url of blacklistedRelays) {
            if (!relays.find((r) => r.url === url)) {
                ret.push({
                    id: url,
                    title: url,
                    isBlacklisted: true,
                    rightView: (
                        <RightView relayUrl={url} />
                    ),
                });
            }
        }

        return ret;
    }, [searchText, relays, selectedPoolIndex, autoConnectRelays, blacklistedRelays]);

    const save = useCallback(() => {
        const autoConnect = new Set<string>();
        const blacklist = new Set<string>();
        for (const [url, connect] of relaySetting.entries()) {
            if (connect) autoConnect.add(url);
            else blacklist.add(url);
        }
        setRelays(autoConnect, blacklist);
        router.back();
    }, [relaySetting]);

    return (
        <View className="flex-1 flex-col">
            <LargeTitleHeader
                title="Relays"
                searchBar={{
                    iosHideWhenScrolling: true,
                    onChangeText: setSearchText,
                }}
                rightView={() => (
                    <TouchableOpacity onPress={save}>
                        <Text className="text-primary">Save</Text>
                    </TouchableOpacity>
                )}
            />

<View className="flex-1 flex-col">
            <List
                contentContainerClassName="pt-4"
                contentInsetAdjustmentBehavior="automatic"
                variant="insets"
                data={[...data, { id: 'add', fn: addFn, set: setUrl }]}
                estimatedItemSize={ESTIMATED_ITEM_HEIGHT.titleOnly}
                renderItem={renderItem}
                    keyExtractor={keyExtractor}
                />
                <SegmentedControl
                values={pools.map((p) => p.name)}
                selectedIndex={selectedPoolIndex}
                onIndexChange={(index) => {
                    setSelectedPoolIndex(index);
                }}
            />
            </View>
        </View>
    );
}

function RightView({
    relay,
    relayUrl,
}: { relay?: NDKRelay, relayUrl: string }) {
    const { colors } = useColorScheme();
    const { showActionSheetWithOptions } = useActionSheet();
    const [relaySetting, setRelaySetting] = useAtom(relaySettingAtom);

    const openActionSheet = useCallback(() => {
        const options = [];
        let destructiveButtonIndex: number | undefined;

        console.log(relaySetting.get(relayUrl), relayUrl, relaySetting);

        if (relaySetting.get(relayUrl) === true) {
            options.push(["Don't auto-connect", null]);
        } else if (relaySetting.get(relayUrl) === false) {
            options.push(["Unblock", null]);
        } else {
            options.push(["Auto-connect", true]);
            options.push(["Block", false]);
            destructiveButtonIndex = 1;
        }

        options.push(["Cancel", undefined]);
        
        showActionSheetWithOptions({
            title: relayUrl,
            options: options.map((o) => o[0]),
            cancelButtonIndex: options.length-1,
            destructiveButtonIndex,
        }, (buttonIndex) => {
            const state = new Map(relaySetting);
            const val = options[buttonIndex][1];
            if (val === undefined) return;
            if (val === null) state.delete(relayUrl);
            else state.set(relayUrl, val);
            setRelaySetting(state);
        })
    }, [showActionSheetWithOptions, relayUrl, relaySetting])

    return (
        <View className="flex-1 flex-row items-center gap-4 px-4 py-2">
            <Button variant="plain" size="icon" onPress={openActionSheet}>
                <Settings size={16} color={colors.muted} />
            </Button>
            {relay && <RelayConnectivityIndicator relay={relay} />}
        </View>
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
                info.item.rightView ?? (
                    <View className="flex-1 flex-row items-center justify-center gap-2 px-4">
                        {info.item.rightText && (
                            <Text variant="callout" className="ios:px-0 px-2 text-muted-foreground">
                                {info.item.rightText}
                            </Text>
                        )}
                        {info.item.badge && (
                            <View className="h-5 w-5 items-center justify-center rounded-full bg-destructive">
                                <Text variant="footnote" className="font-bold leading-4 text-destructive-foreground">
                                    {info.item.badge}
                                </Text>
                            </View>
                        )}
                        <ChevronRight />
                    </View>
                )
            }
            {...info}
            onPress={info.item.onPress}
        >
            {info.item.isAutoConnect && <Text className="text-muted-foreground text-xs">Auto-connect</Text>}
            {info.item.isBlacklisted && <Text className="text-muted-foreground text-xs">Won't connect</Text>}
            {!info.item.isBlacklisted && !info.item.isAutoConnect && <Text className="text-muted-foreground text-xs">
                Used when needed
            </Text>}
        </ListItem>
    );
}

function ChevronRight() {
    const { colors } = useColorScheme();
    return <Icon name="chevron-right" size={17} color={colors.grey} />;
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
    return typeof item === 'string' ? item : item.id;
}
