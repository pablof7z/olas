import { type NDKEvent, useNDKCurrentPubkey, useNDKCurrentUser, useProfileValue } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeOut, SlideInRight } from 'react-native-reanimated';

import { showStoriesModalAtom, storiesAtom } from '../store';

import UserAvatar from '@/components/ui/user/avatar';
import { useStories } from '@/hooks/stories';
import { useUserFlare } from '@/hooks/user-flare';
import { useColorScheme } from '@/lib/useColorScheme';
import { activeEventAtom } from '@/stores/event';

const AVATAR_SIZE = 80;

function StoryPrompt() {
    const currentPubkey = useNDKCurrentPubkey();
    const userProfile = useProfileValue(currentPubkey || undefined, { skipVerification: true });
    const { colors } = useColorScheme();

    const handlePress = useCallback(() => {
        router.push('/story');
    }, []);

    if (!currentPubkey) return null;

    return (
        <Animated.View entering={SlideInRight} exiting={FadeOut}>
            <Pressable
                onPress={handlePress}
                style={{ flexDirection: 'column', alignItems: 'center', padding: 5 }}
            >
                <UserAvatar
                    pubkey={currentPubkey}
                    userProfile={userProfile}
                    imageSize={AVATAR_SIZE}
                    borderWidth={3}
                />
                <Text style={[styles.name, { color: colors.foreground }]}>Your story</Text>
            </Pressable>
        </Animated.View>
    );
}

export function Stories({ style }: { style?: StyleProp<ViewStyle> }) {
    const stories = useStories();
    const currentPubkey = useNDKCurrentPubkey();

    const renderItem = useCallback(
        ({
            item: [pubkey, { events, live }],
            index,
        }: {
            item: [string, { events: NDKEvent[]; live: boolean }];
            index: number;
        }) => {
            if (pubkey === 'prompt') {
                return <StoryPrompt />;
            }
            return <StoryEntry events={events} live={live} />;
        },
        []
    );

    // if (stories.size === 0) {
    //     return null;
    // }

    const storyEntries = Array.from(stories.entries());
    if (currentPubkey && !stories.has(currentPubkey)) {
        const prompt: [string, { events: NDKEvent[]; live: boolean }] = [
            'prompt',
            { events: [], live: false },
        ];
        storyEntries.unshift(prompt);
    }

    return (
        <View style={[styles.stories, style]}>
            <Animated.FlatList
                style={styles.stories}
                data={storyEntries}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={([pubkey, { events, live }]) => {
                    return pubkey;
                }}
                renderItem={renderItem}
            />
        </View>
        // horizontal className="flex-none flex border-b border-border">
        // <View className="flex-1 flex-row gap-4 p-2">
        //     {Array.from(filteredEvents.entries()).map(([pubkey, events]) => (
        //         <StoryEntry key={pubkey} events={events} />
        //     ))}
        // </View>
    );
}

function StoryEntry({ events, live }: { events: NDKEvent[]; live: boolean }) {
    const pubkey = events[0].pubkey;
    const userProfile = useProfileValue(pubkey, { skipVerification: true });
    const flare = useUserFlare(pubkey);

    const setStories = useSetAtom(storiesAtom);
    const setActiveEvent = useSetAtom(activeEventAtom);

    const setShowStoriesModal = useSetAtom(showStoriesModalAtom);
    const { colors } = useColorScheme();
    if (userProfile?.name === 'deleted-account') return null;

    return (
        <Animated.View entering={SlideInRight} exiting={FadeOut}>
            <Pressable
                style={{ flexDirection: 'column', alignItems: 'center', padding: 5 }}
                onPress={() => {
                    if (live) {
                        setActiveEvent(events[0]);
                        router.push('/live');
                    } else {
                        setStories(events);
                        setShowStoriesModal(true);
                        router.push('/stories');
                    }
                }}
            >
                <UserAvatar
                    pubkey={pubkey}
                    userProfile={userProfile}
                    imageSize={AVATAR_SIZE}
                    flare={live ? 'live' : flare}
                    includeFlareLabel={false}
                    borderWidth={3}
                />
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.name, { color: colors.foreground }]}
                >
                    {userProfile?.name}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    stories: {
        height: AVATAR_SIZE + 25,
    },
    name: {
        fontSize: 12,
        marginTop: 3,
        maxWidth: AVATAR_SIZE,
        textAlign: 'center',
    },
});
