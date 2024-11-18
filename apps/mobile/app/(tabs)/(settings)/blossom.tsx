import { useNDK } from '@/ndk-expo';
import { Icon, MaterialIconName } from '@roninoss/icons';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import * as User from '@/ndk-expo/components/user';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/nativewindui/Avatar';
import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { NDKKind, NDKList, NDKPrivateKeySigner, NDKRelay, NDKRelayStatus, NDKUser, NostrEvent } from '@nostr-dev-kit/ndk';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useNDKSession } from '@/ndk-expo/hooks/session';

export default function BlossomScreen() {
    const { ndk } = useNDK();
    const { events } = useNDKSession();
    const blossomList = useMemo(() => {
        let list = events?.get(NDKKind.BlossomList)?.[0] as NDKList;
        if (!list) {
            list = new NDKList(ndk, { kind: NDKKind.BlossomList } as NostrEvent);
        }
        return list;
    }, [events]);
    const [searchText, setSearchText] = useState<string | null>(null);
    const [blossoms, setBlossoms] = useState<string[]>(blossomList?.items.filter((item) => item[0] === 'server').map((item) => item[1]));
    const [url, setUrl] = useState('');

    if (blossoms.length === 0) {
        setBlossoms(['https://blossom.primal.net']);
    }

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
            }))
            .filter((item) => (searchText ?? '').trim().length === 0 || item.title.match(searchText!));
    }, [ndk?.pool.relays, searchText, blossoms]);

    function save() {
        blossomList.tags = blossomList.tags.filter((tag) => tag[0] !== 'server');

        for (const url of blossoms) {
            blossomList.addItem(['server', url]);
        }

        blossomList.publishReplaceable();
        router.back();
    }

    return (
        <>
            <LargeTitleHeader
                title="🌸 Blossom Servers"
                searchBar={{ iosHideWhenScrolling: true, onChangeText: setSearchText }}
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
                <TextInput className="flex-1 text-lg" placeholder="Add blossom server" onChangeText={info.item.set} autoCapitalize="none" autoCorrect={false} />
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
                info.index > 0 && (
                    <TouchableOpacity onPress={info.item.makeDefault}>
                        <Text className="mt-2 pr-4 text-xs text-primary">Make default</Text>
                    </TouchableOpacity>
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
