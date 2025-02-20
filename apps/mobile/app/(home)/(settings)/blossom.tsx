import { useNDK, useNDKSessionEventKind } from '@nostr-dev-kit/ndk-mobile';
import { useEffect, useMemo, useState } from 'react';

import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { NDKKind, NDKList, NostrEvent } from '@nostr-dev-kit/ndk-mobile';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { DEFAULT_BLOSSOM_SERVER } from '@/hooks/blossom';
import { Button } from '@/components/nativewindui/Button';
import { View } from 'react-native';

export default function BlossomScreen() {
    const { ndk } = useNDK();
    const blossomList = useNDKSessionEventKind<NDKList>(NDKKind.BlossomList, { create: NDKList });
    const [searchText, setSearchText] = useState<string | null>(null);
    const [blossoms, setBlossoms] = useState<string[]>(blossomList?.items.filter((item) => item[0] === 'server').map((item) => item[1]));
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (blossoms.length === 0) {
            setBlossoms([DEFAULT_BLOSSOM_SERVER]);
        }
    }, []);

    console.log('blossoms', blossoms);

    const addFn = () => {
        console.log({ url });
        try {
            const uri = new URL(url);
            if (!['https:'].includes(uri.protocol)) {
                alert('Invalid protocol');
                return;
            }
            if (url) setBlossoms([...blossoms, url]);
            setUrl('');
        } catch (e) {
            alert('Invalid URL');
        }
    };

    const data = useMemo(() => {
        if (!ndk) return [];

        return blossoms
            .map((url: string) => ({
                id: url,
                title: url,
                makeDefault: () => {
                    // move this to the top of the list
                    setBlossoms([url, ...blossoms.filter((u) => u !== url)]);
                },
                removeServer: () => {
                    setBlossoms([...blossoms.filter((u) => u !== url)]);
                },
            }))
            .filter((item) => (searchText ?? '').trim().length === 0 || item.title.match(searchText!));
    }, [searchText, blossoms]);

    function save() {
        console.log('save', blossomList.kind);
        blossomList.ndk = ndk;
        blossomList.kind = NDKKind.BlossomList;
        blossomList.tags = blossomList.tags.filter((tag) => tag[0] !== 'server');

        for (const url of blossoms) {
            blossomList.addItem(['server', url]);
            console.log('adding item', url);
        }

        console.log('blossomList', blossomList.tags);
        blossomList
            .sign()
            .then(() => {
                console.log('event', blossomList.rawEvent());
                blossomList.publishReplaceable();
                router.back();
            })
            .catch((e) => {
                console.log('error', e);
            });
    }

    return (
        <>
            <LargeTitleHeader
                title="🌸 Blossom Servers"
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
                    placeholder="Add blossom server"
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
                info.index > 0 ? (
                    <TouchableOpacity onPress={info.item.makeDefault}>
                        <Text className="mt-2 pr-4 text-xs text-primary">Make default</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="flex-1 flex-row items-center gap-4 px-4 py-2">
                        <Button variant="secondary" size="sm" onPress={info.item.removeServer}>
                            <Text>Remove</Text>
                        </Button>
                    </View>
                )
            }
            {...info}
            onPress={() => console.log('onPress')}
        />
    );
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
    return typeof item === 'string' ? item : item.id;
}
