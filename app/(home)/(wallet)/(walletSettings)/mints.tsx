import { useColorScheme } from '@/lib/useColorScheme';
import type { GetInfoResponse } from '@cashu/cashu-ts';
import { NDKCashuMintList, useNDK, useNDKWallet, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import {
    ESTIMATED_ITEM_HEIGHT,
    List,
    type ListDataItem,
    ListItem,
    type ListRenderItemInfo,
    ListSectionHeader,
} from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';

export default function MintsScreen() {
    const { ndk } = useNDK();
    const { activeWallet } = useNDKWallet() as { activeWallet: NDKCashuWallet };
    const [searchText, setSearchText] = useState<string | null>(null);
    const [url, setUrl] = useState<string>('');
    const [mints, setMints] = useState<string[]>(activeWallet?.mints ?? []);

    const filter = useMemo(() => [{ kinds: [38172], limit: 50 }], [1]);
    const opts = useMemo(() => ({ groupable: false, closeOnEose: true, subId: 'mints' }), []);
    const { events: mintList } = useSubscribe(filter, opts);
    const [mintInfos, _setMintInfos] = useState<Record<string, GetInfoResponse | null>>({});

    const addFn = useCallback(() => {
        try {
            const uri = new URL(url);
            if (!['https:', 'http:'].includes(uri.protocol)) {
                alert('Invalid protocol');
                return;
            }
            setMints([...mints, url]);
            setUrl('');
        } catch (_e) {
            alert('Invalid URL2');
        }
    }, [url, mints]);

    const data = useMemo(() => {
        if (!ndk || !activeWallet) return [];
        const regexp = new RegExp(/${searchText}/i);

        const m = mints
            .map((mint) => ({
                id: mint,
                title: mint,
                removeFn: () => removeMint(mint),
            }))
            .filter((item) => (searchText ?? '').trim().length === 0 || item.title.match(regexp!));

        m.push({ id: 'add', addFn, set: setUrl });

        for (const event of mintList) {
            const url = event.tagValue('u');
            if (!url || mints.includes(url)) continue;
            const niceUrl = new URL(url).hostname;

            // if (mintInfos[url] === undefined) {
            //     setMintInfos({...mintInfos, [url]: null});
            //     CashuMint.getInfo(url).then(info => setMintInfos({...mintInfos, [url]: info}));
            // }

            m.push({
                id: url,
                title: mintInfos[url]?.name ?? niceUrl,
                subTitle: url,
                addFn: () => addMint(url),
            });
        }

        return m;
    }, [mintList, mints, searchText, mintInfos, addFn]);

    const save = async () => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;

        activeWallet.mints = mints;
        await activeWallet.getP2pk();
        activeWallet.publish().then(() => {
            const mintList = new NDKCashuMintList(ndk);
            mintList.mints = mints;
            mintList.relays = activeWallet.relays;
            mintList.p2pk = activeWallet.p2pk;
            mintList.publish();
            router.back();
        });
    };

    const addMint = (url: string) => {
        setMints([...mints, url]);
    };

    const removeMint = (url: string) => {
        setMints(mints.filter((u) => u !== url));
    };

    const { colors } = useColorScheme();

    return (
        <View style={{ backgroundColor: colors.card, flex: 1 }}>
            <LargeTitleHeader
                title="Mints"
                searchBar={{ iosHideWhenScrolling: true, onChangeText: setSearchText }}
                rightView={() => (
                    <TouchableOpacity onPress={save}>
                        <Text className="text-primary">Save</Text>
                    </TouchableOpacity>
                )}
            />
            <View className="flex-1">
                <List
                    contentContainerClassName="pt-4"
                    contentInsetAdjustmentBehavior="automatic"
                    variant="insets"
                    data={data}
                    estimatedItemSize={ESTIMATED_ITEM_HEIGHT.titleOnly}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    sectionHeaderAsGap
                />
            </View>
        </View>
    );
}

function renderItem<T extends (typeof data)[number]>(info: ListRenderItemInfo<T>) {
    if (info.item.id === 'add') {
        return (
            <ListItem
                className={cn(
                    'ios:pl-0 pl-2',
                    info.index === 0 &&
                        'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                )}
                titleClassName="text-lg"
                leftView={info.item.leftView}
                rightView={
                    <TouchableOpacity onPress={info.item.addFn}>
                        <Text className="mt-2 pr-4 text-primary">Add</Text>
                    </TouchableOpacity>
                }
                {...info}
            >
                <TextInput
                    className="flex-1 text-lg text-foreground"
                    placeholder="Add mint"
                    onChangeText={info.item.set}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </ListItem>
        );
    } else if (info.item.kind === 38172) {
    }
    return (
        <ListItem
            className={cn(
                'ios:pl-0 pl-2',
                info.index === 0 &&
                    'ios:border-t-0 border-border/25 dark:border-border/80 border-t',
                info.item.id.match(/testnut/i) && '!bg-red-500/20'
            )}
            titleClassName="text-lg"
            leftView={info.item.leftView}
            rightView={
                info.item.addFn ? (
                    <TouchableOpacity onPress={info.item.addFn}>
                        <Text className="mt-2 pr-4 text-primary">Add</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={info.item.removeFn}>
                        <Text className="mt-2 pr-4 text-primary">Remove</Text>
                    </TouchableOpacity>
                )
            }
            {...info}
        />
    );
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
    return typeof item === 'string' ? item : item.id;
}
