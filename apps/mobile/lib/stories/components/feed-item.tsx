import UserAvatar from "@/components/ui/user/avatar";
import { useStories } from "@/hooks/stories";
import { activeEventAtom } from "@/stores/event";
import { NDKEvent, useUserProfile, useNDKCurrentUser } from "@nostr-dev-kit/ndk-mobile";
import { router } from "expo-router";
import { useSetAtom } from "jotai";
import { Pressable, StyleSheet, View, Text, ViewStyle, StyleProp } from "react-native";
import { FadeOut, SlideInRight } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import { storiesAtom, showStoriesModalAtom } from "../store";
import { useUserFlare } from "@/hooks/user-flare";
import { useCallback } from "react";
import { usePostEditorStore } from "@/lib/post-editor/store";
import { useColorScheme } from "@/lib/useColorScheme";

const AVATAR_SIZE = 80;

function StoryPrompt() {
    const currentUser = useNDKCurrentUser();
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const setPostMetadata = usePostEditorStore((s) => s.setMetadata);
    const { colors } = useColorScheme();

    const handlePress = useCallback(() => {
        openPickerIfEmpty();
        setPostMetadata({ caption: '', expiration: Date.now() + (24 * 60 * 60 * 1000) });
        router.push('/(publish)');
        // router.push('/(camera)/CameraPage');
    }, [])

    if (!currentUser) return null;
    
    return <Animated.View
        entering={SlideInRight}
        exiting={FadeOut}
    >
        <Pressable onPress={handlePress} style={{ flexDirection: 'column', alignItems: 'center', padding: 5 }}>
            <UserAvatar pubkey={currentUser!.pubkey} userProfile={userProfile} imageSize={AVATAR_SIZE} borderWidth={3} />
            <Text style={[styles.name, { color: colors.foreground }]}>Your story</Text>
        </Pressable>
    </Animated.View>
}

export function Stories({ style }: { style?: StyleProp<ViewStyle> }) {
    const stories = useStories();
    const currentUser = useNDKCurrentUser();

    const renderItem = useCallback(({item: [pubkey, { events, live }], index, target}: {item: [string, { events: NDKEvent[], live: boolean }], index: number, target: any}) => {
        if (pubkey === 'prompt') {
            return <StoryPrompt />
        }
        return <StoryEntry events={events} live={live} />
    }, []);


    // if (stories.size === 0) {
    //     return null;
    // }

    const storyEntries = Array.from(stories.entries());
    if (!stories.has(currentUser?.pubkey)) {
        const prompt: [string, { events: NDKEvent[], live: boolean }] = ["prompt", { events: [], live: false }];
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
                    return pubkey
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

function StoryEntry({ events, live }: { events: NDKEvent[], live: boolean }) {
    const pubkey = events[0].tagValue('p') ?? events[0].pubkey;
    const { userProfile } = useUserProfile(pubkey);
    const flare = useUserFlare(pubkey);

    const setStories = useSetAtom(storiesAtom);
    const setActiveEvent = useSetAtom(activeEventAtom);

    const setShowStoriesModal = useSetAtom(showStoriesModalAtom);
    const { colors } = useColorScheme();
    if (userProfile?.name === 'deleted-account') return null;

    return (
        <Animated.View
            entering={SlideInRight}
            exiting={FadeOut}
        >
            <Pressable style={{ flexDirection: 'column', alignItems: 'center', padding: 5 }} onPress={() => {
                if (live) {
                    console.log(JSON.stringify(events[0].rawEvent(), null, 4));
                    setActiveEvent(events[0]);
                    router.push('/live');
                }  else {
                    setStories(events);
                    setShowStoriesModal(true);
                    router.push('/stories');
                }
            }}>
                <UserAvatar pubkey={pubkey} userProfile={userProfile} imageSize={AVATAR_SIZE} flare={live ? 'live' : flare} includeFlareLabel={false} borderWidth={3} />
                <Text 
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.name, { color: colors.foreground }]}
                >{userProfile?.name}</Text>
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
        textAlign: 'center'
    }
})