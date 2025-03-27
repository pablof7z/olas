import { toast } from '@backpackapp-io/react-native-toast';
import { NDKEvent, NDKRelaySet, NDKSubscriptionCacheUsage, NDKUser, NostrEvent, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { Search } from 'lucide-react-native';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { TextInput, View, StyleSheet, Pressable } from 'react-native';

import { searchQueryAtom, useSearchQuery } from './store';

import { searchInputRefAtom } from '@/components/FeedType/store';
import { useColorScheme } from '@/lib/useColorScheme';

export default function SearchInput() {
    const searchQuery = useAtomValue(searchQueryAtom);
    const setSearchQuery = useSearchQuery();
    const [input, setInput] = useState(searchQuery);
    const setSearchInputRef = useSetAtom(searchInputRefAtom);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        setInput(searchQuery);
    }, [searchQuery]);

    // useEffect(() => {
    //     if (feedType.kind === 'search' && feedType.value && feedType.value !== knownLastSearchFeed.current && !isSavedSearch) {
    //         setInput(feedType.value);
    //         knownLastSearchFeed.current = feedType.value;
    //     }
    // }, [feedType.kind, feedType.value, input, setInput, isSavedSearch]);

    useEffect(() => {
        setSearchInputRef(inputRef);
    }, []);

    const { ndk } = useNDK();

    const dvmRelaySet = useMemo(() => {
        if (!ndk) return null;
        return NDKRelaySet.fromRelayUrls(['wss://relay.vertexlab.io'], ndk);
    }, [ndk]);

    const dvmSearch = useCallback(async (input: string) => {
        const req = new NDKEvent(ndk, {
            kind: 5315,
            tags: [['param', 'search', input]],
        } as NostrEvent);
        await req.sign();

        try {
            const sub = ndk.subscribe(
                [{ kinds: [6315, 7000], ...req.filter() }],
                { cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY },
                dvmRelaySet,
                {
                    onEvent: (event) => {
                        if (event.kind === 7000) {
                            const statusTag = event.getMatchingTags('status')?.[0];
                            const status = statusTag?.[2] ?? statusTag?.[1];
                            if (status) toast(status);
                            return;
                        }

                        sub.stop();

                        try {
                            const records = JSON.parse(event.content);
                            for (const record of records) {
                                if (record.pubkey) {
                                    router.push(`/profile?pubkey=${record.pubkey}`);
                                    return;
                                }
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    },
                    onEose: (event) => {
                        req.publish(dvmRelaySet);
                    },
                }
            );
            sub.start();
        } catch (e) {
            console.error(e);
        }
    }, []);

    const search = useCallback(
        async (input: string) => {
            if (input.startsWith('npub1')) {
                try {
                    const user = new NDKUser({ npub: input });
                    router.push(`/profile?pubkey=${user.pubkey}`);
                    return;
                } catch {}
            } else if (input.startsWith('@') && !input.match(/\./)) {
                dvmSearch(input.slice(1));
            } else if (input.match(/@/)) {
                const user = await ndk.getUserFromNip05(input);
                if (user) {
                    router.push(`/profile?pubkey=${user.pubkey}`);
                    return;
                }
            }

            setSearchQuery(input.trim());
        },
        [setSearchQuery]
    );

    const handleInputChange = useCallback(
        (text: string) => {
            if (text.startsWith('@')) {
                // find usernames that match the input
                // cacheAdapter.db.
            }

            setInput(text);
        },
        [input, setInput]
    );

    const { colors } = useColorScheme();

    return (
        <View style={styles.container}>
            <TextInput
                ref={inputRef}
                placeholder="Search"
                onChangeText={handleInputChange}
                value={input}
                autoCapitalize="none"
                autoComplete="off"
                style={[styles.input, { color: colors.foreground }]}
                autoCorrect={false}
                onSubmitEditing={() => search(input)}
            />

            <Pressable onPress={() => setSearchQuery(input)}>
                <Search size={24} color={colors.foreground} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'semibold',
    },
});
