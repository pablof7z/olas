import UserAvatar from "@/components/ui/user/avatar";
import { useStories } from "@/hooks/stories";
import { activeEventAtom } from "@/stores/event";
import { useNDKCurrentUser, NDKEvent, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { router } from "expo-router";
import { useSetAtom } from "jotai";
import { View, FlatList, Pressable, StyleSheet } from "react-native";
import { FadeIn, FadeOut } from "react-native-reanimated";
import Animated from "react-native-reanimated";
import StoriesModal from "../Modal";
import { storiesAtom, showStoriesModalAtom } from "../store";
import { useUserFlare } from "@/hooks/user-flare";

export function Stories() {
    const stories = useStories();

    return (
        <>
            <FlatList
                style={styles.stories}
                data={Array.from(stories.entries())}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={([pubkey, { events, live }]) => {
                    return pubkey
                }}

                renderItem={({item: [pubkey, { events, live }], index, target}) => (
                    <StoryEntry events={events} live={live} />
                    // <LiveViewEntry event={item} />
                )}
            />
            <StoriesModal />
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
            entering={FadeIn}
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
                }
            }}>
                <UserAvatar pubkey={pubkey} userProfile={userProfile} imageSize={70} flare={live ? 'live' : flare} includeFlareLabel={true} />
            </Pressable>
        </Animated.View>
    );
}


const styles = StyleSheet.create({
    stories: {
        height: 80,
    }
})