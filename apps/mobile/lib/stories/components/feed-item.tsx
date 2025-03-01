import UserAvatar from "@/components/ui/user/avatar";
import { useStories } from "@/hooks/stories";
import { activeEventAtom } from "@/stores/event";
import { NDKEvent, useUserProfile, useNDKCurrentUser } from "@nostr-dev-kit/ndk-mobile";
import { router } from "expo-router";
import { useSetAtom } from "jotai";
import { Pressable, StyleSheet, View, Text } from "react-native";
import { FadeOut, SlideInRight } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import StoriesModal from "../Modal";
import { storiesAtom, showStoriesModalAtom } from "../store";
import { useUserFlare } from "@/hooks/user-flare";
import { useCallback } from "react";
import { usePostEditorStore } from "@/lib/post-editor/store";

function StoryPrompt() {
    const currentUser = useNDKCurrentUser();
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const setPostMetadata = usePostEditorStore((s) => s.setMetadata);
    const { openPickerIfEmpty } = usePostEditorStore();

    const handlePress = useCallback(() => {
        openPickerIfEmpty();
        setPostMetadata({ caption: '', expiration: Date.now() + (24 * 60 * 60 * 1000) });
        router.push('/(publish)');
        // router.push('/(camera)/CameraPage');
    }, [])

    if (!currentUser) return null;
    
    return <Pressable onPress={handlePress} style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 5 }}>
        <UserAvatar pubkey={currentUser!.pubkey} userProfile={userProfile} imageSize={70} flare={'story_prompt'} includeFlareLabel={true} />
    </Pressable>
}

export function Stories() {
    const stories = useStories();
    const currentUser = useNDKCurrentUser();

    const renderItem = useCallback(({item: [pubkey, { events, live }], index, target}) => {
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
        <>
            <Animated.FlatList
                style={styles.stories}
                className="flex-none flex border-b border-border"
                data={storyEntries}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={([pubkey, { events, live }]) => {
                    return pubkey
                }}
                renderItem={renderItem}
            />
        </>
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

    return (
        <Animated.View
            entering={SlideInRight}
            exiting={FadeOut}
        >
            <Pressable style={{ flexDirection: 'column', alignItems: 'center', margin: 5 }} onPress={() => {
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
                <UserAvatar pubkey={pubkey} userProfile={userProfile} imageSize={70} flare={live ? 'live' : flare} includeFlareLabel={false} />
            </Pressable>
        </Animated.View>
    );
}


const styles = StyleSheet.create({
    stories: {
        height: 85,
    }
})