import { NDKEvent, type NostrEvent } from '@nostr-dev-kit/ndk-mobile';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

type BookmarkProps = {
    /**
     * Event the user is reacting to
     */
    event: NDKEvent;

    /**
     * Muted color
     */
    mutedColor: string;

    /**
     * Icon size
     */
    iconSize?: number;

    /**
     * If the user has bookmarked the event
     */
    bookmarkedByUser: boolean;
};

let _bookmarkRenderCost = 0;
setInterval(() => {}, 10000);

export default function BookmarkButton({
    event,
    mutedColor,
    iconSize = 18,
    bookmarkedByUser,
}: BookmarkProps) {
    const start = performance.now();

    const _bookmark = useCallback(async () => {
        if (bookmarkedByUser) return;
        const bookmarkEvent = new NDKEvent(event.ndk, {
            kind: 3006,
            tags: [['k', event.kind.toString()]],
        } as NostrEvent);
        bookmarkEvent.tag(event);
        bookmarkEvent.publish();
    }, [event.id, bookmarkedByUser]);

    const end = performance.now();
    _bookmarkRenderCost += end - start;

    return (
        <View style={styles.container}>
            {/* <TouchableOpacity onPress={bookmark}>
                <Bookmark
                    size={iconSize}
                    fill={bookmarkedByUser ? 'red' : 'transparent'}
                    color={bookmarkedByUser ? 'red' : mutedColor}
                />
            </TouchableOpacity> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
});
