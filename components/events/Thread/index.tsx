import { View, StyleSheet, Dimensions } from "react-native";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { PostHeader } from "../Post/Header";
import { useProfileValue } from "@nostr-dev-kit/ndk-hooks";
import { MediaSection } from "../Post";
import { useAppSettingsStore } from "@/stores/app";
import { useHeaderHeight } from "@react-navigation/elements";
import UserAvatar from "@/components/ui/user/avatar";
import EventContent from "@/components/ui/event/content";
import { useCallback } from "react";
import { useCommentBottomSheet } from "@/lib/comments/bottom-sheet";
import { useReactionsStore } from "@/stores/reactions";
import { Reactions } from "../Post/Reactions";

export default function Thread({ events }: { events: NDKEvent[] }) {
    const userProfile = useProfileValue(events[0]?.pubkey, { subOpts: { skipVerification: true } });
    const forceSquareAspectRatio = useAppSettingsStore(s => s.forceSquareAspectRatio);

    const headerHeight = useHeaderHeight();
    const screen = Dimensions.get('window');
    const maxHeight = Math.floor(
        forceSquareAspectRatio ? screen.width * 1.1 : screen.height * 0.8 - headerHeight
    );

    if (!events[0]) {
        return null;
    }
    
    return (
        <View style={styles.threadContainer}>
            <PostHeader event={events[0]} reposts={[]} timestamp={events[0].created_at} userProfile={userProfile} />

            {events.map((event, index) => {
                return (
                    <View style={styles.threadItemContainer} key={event.id ?? index}>
                        <View style={{ flexDirection: 'column', marginRight: 8, alignContent: 'center' }}>
                            <UserAvatar pubkey={event.pubkey} userProfile={userProfile}  imageSize={32} />
                        </View>
                        <View style={{ flexDirection: 'column', marginRight: 8, alignContent: 'center', flex: 1 }}>
                            <EventContent event={event}  />
                            <MediaSection event={event} maxHeight={maxHeight} />
                            <ThreadItemBottom event={event} />
                        </View>
                    </View>
                );
            })}
        </View>
    )
}

function ThreadItemBottom({ event }: { event: NDKEvent }) {
    const openComment = useCommentBottomSheet();
    const showComment = useCallback(() => {
        openComment(event);
    }, [event]);

    const reactions = useReactionsStore((state) => state.reactions.get(event.tagId()));

    return (
        <View style={styles.postBottom}>
            <Reactions event={event} reactions={reactions} iconSize={14} />
        </View>
    );
}

const styles = StyleSheet.create({
    threadContainer: {
        flex: 1,
    },
    threadItemContainer: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 12,
    },
    postBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
});