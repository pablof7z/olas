import {
    NDKKind,
    NDKList,
    NostrEvent,
    useNDK,
    useNDKSessionEvent,
} from '@nostr-dev-kit/ndk-hooks';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';

import { Button } from '@/components/nativewindui/Button';
import { DEFAULT_BLOSSOM_SERVER } from '@/hooks/blossom';
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

export default function BlossomScreen() {
    const { ndk } = useNDK();
    const blossomList = useNDKSessionEvent<NDKList>(NDKKind.BlossomList, { create: NDKList });
    const [searchText, setSearchText] = useState<string | null>(null);
    const [blossoms, setBlossoms] = useState<string[]>(
        blossomList?.items.filter((item) => item[0] === 'server').map((item) => item[1])
    );
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (blossoms.length === 0) {
            setBlossoms([DEFAULT_BLOSSOM_SERVER]);
        }
    }, []);

    const addFn = () => {
        try {
            const uri = new URL(url);
            if (!['https:'].includes(uri.protocol)) {
                alert('Invalid protocol');
                return;
            }
            if (url) setBlossoms([...blossoms, url]);
            setUrl('');
        } catch (_e) {
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
            .filter(
                (item) => (searchText ?? '').trim().length === 0 || item.title.match(searchText!)
            );
    }, [searchText, blossoms]);

    function save() {
        blossomList.ndk = ndk;
        blossomList.kind = NDKKind.BlossomList;
        blossomList.tags = blossomList.tags.filter((tag) => tag[0] !== 'server');

        for (const url of blossoms) {
            blossomList.addItem(['server', url]);
        }
        blossomList
            .sign()
            .then(() => {
                blossomList.publishReplaceable();
                router.back();
            })
            .catch((_e) => {});
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
                className={cn(
                    'ios:pl-0 pl-2',
                    info.index === 0 &&
                        'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                )}
                titleClassName="text-lg"
                leftView={info.item.leftView}
                rightView={
                    <TouchableOpacity onPress={info.item.fn}>
                        <Text className="mt-2 pr-4 text-primary">Add</Text>
                    </TouchableOpacity>
                }
                {...info}
            >
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
            className={cn(
                'ios:pl-0 pl-2',
                info.index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
            )}
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
            onPress={() => {}}
        />
    );
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
    return typeof item === 'string' ? item : item.id;
}
