import { toast } from '@backpackapp-io/react-native-toast'; // Import toast
import { NDKList, useMuteCriteria, useNDK, useProfileValue } from '@nostr-dev-kit/ndk-mobile';
import type { RenderTarget } from '@shopify/flash-list';
import { Stack, router } from 'expo-router';
import { atom, useAtom } from 'jotai';
import { Delete } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { List, ListItem, ListSectionHeader } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import * as User from '@/components/ui/user';

const hashtagsAtom = atom<string[]>([]);
const pubkeysAtom = atom<string[]>([]);

export default function MutedScreen() {
    const { hashtags: mutedHashtags, pubkeys: mutedPubkeys } = useMuteCriteria();
    const [hashtags, setHashtags] = useAtom(hashtagsAtom);
    const [pubkeys, setPubkeys] = useAtom(pubkeysAtom);

    useEffect(() => {
        setHashtags(Array.from(mutedHashtags));
        setPubkeys(Array.from(mutedPubkeys));
    }, [mutedHashtags, mutedPubkeys]);

    const data = useMemo(() => {
        const v = [];

        v.push({ id: 'hashtags', type: 'header', value: 'Hashtags' });
        v.push(...hashtags.map((h) => ({ id: `hashtag-${h}`, type: 'hashtag', value: h })));
        v.push({ id: 'hashtag-add', type: 'hashtag-add' });

        if (pubkeys.length > 0) {
            v.push({ id: 'users', type: 'header', value: 'Users' });
            v.push(...pubkeys.map((p) => ({ id: `user-${p}`, type: 'user', value: p })));
        }

        return v;
    }, [hashtags.length, pubkeys.length]);

    const { ndk } = useNDK();

    const save = useCallback(async () => {
        if (!ndk) {
            console.error('NDK not available to create mute list.');
            toast.error('Error updating mute list.');
            return;
        }
        const event = new NDKList(ndk);
        event.kind = 10000;
        event.tags = [...hashtags.map((h) => ['t', h]), ...pubkeys.map((p) => ['p', p])];
        await event.sign();
        await event.publishReplaceable();
        router.back();
    }, [hashtags, pubkeys]);

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: 'Muted Content',
                    headerRight: () => (
                        <Button variant="plain" onPress={save}>
                            <Text className="text-primary">Save</Text>
                        </Button>
                    ),
                }}
            />
            <List
                data={data}
                variant="insets"
                estimatedItemSize={50}
                keyExtractor={(item) => item.id}
                getItemType={(item) => item.type}
                renderItem={({ item, index, target }) => (
                    <Item item={item} index={index} target={target} />
                )}
            />
        </>
    );
}

function HashtagAddItem({
    item,
    index,
    target,
}: { item: any; index: number; target: RenderTarget }) {
    const [hashtag, setHashtag] = useState('');
    const [hashtags, setHashtags] = useAtom(hashtagsAtom);
    const getFocus = useRef(false);

    const add = useCallback(() => {
        setHashtags([...hashtags, hashtag]);
        getFocus.current = true;
        setHashtag('');
    }, [hashtag, setHashtags]);

    return (
        <View className="flex-row items-center justify-between gap-2 bg-card">
            <TextInput
                value={hashtag}
                onChangeText={setHashtag}
                placeholder="Add hashtag"
                onSubmitEditing={add}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 p-4"
                autoFocus={getFocus.current}
            />
            {hashtag.length > 0 && (
                <Button onPress={add} variant="plain">
                    <Text>Add</Text>
                </Button>
            )}
        </View>
    );
}

function Item({ item, index, target }: { item: any; index: number; target: RenderTarget }) {
    if (item.type === 'header') {
        return <ListSectionHeader item={item.value} index={index} target={target} />;
    } else if (item.type === 'hashtag') {
        return <HashtagItem hashtag={item.value} index={index} target={target} />;
    } else if (item.type === 'user') {
        return <MutedUserListItem pubkey={item.value} index={index} target={target} />;
    } else if (item.type === 'hashtag-add') {
        return <HashtagAddItem item={item} index={index} target={target} />;
    }

    return <ListItem item={item} index={index} target={target} />;
}

function HashtagItem({
    hashtag,
    index,
    target,
}: { hashtag: string; index: number; target: RenderTarget }) {
    const [hashtags, setHashtags] = useAtom(hashtagsAtom);
    const remove = useCallback(() => {
        setHashtags(hashtags.filter((h) => h !== hashtag));
    }, [hashtag, setHashtags, hashtags]);

    return (
        <ListItem
            item={{ title: hashtag }}
            index={index}
            target={target}
            rightView={<RemoveButton onPress={remove} />}
        />
    );
}

function MutedUserListItem({
    pubkey,
    target,
    index,
}: { pubkey: string; target: RenderTarget; index: number }) {
    const userProfile = useProfileValue(pubkey, { subOpts: { skipVerification: true } });
    const [pubkeys, setPubkeys] = useAtom(pubkeysAtom);

    const remove = useCallback(() => {
        setPubkeys(pubkeys.filter((p) => p !== pubkey));
    }, [pubkey, pubkeys, setPubkeys]);

    return (
        <ListItem
            index={index}
            target={target}
            item={{
                title: userProfile?.name ?? pubkey,
                subtitle: <Text className="text-muted-foreground">{pubkey}</Text>,
            }}
            leftView={<User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={24} />}
            rightView={<RemoveButton onPress={remove} />}
        />
    );
}

function RemoveButton({ onPress }: { onPress: () => void }) {
    return (
        <Button variant="plain" onPress={onPress}>
            <Delete size={16} />
        </Button>
    );
}
