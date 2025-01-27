import { NDKKind, NDKEvent, NDKUser, NostrEvent } from "@nostr-dev-kit/ndk-mobile";
import { Bookmark } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { useObserver } from "@/hooks/observer";

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
}

let bookmarkRenderCost = 0;
setInterval(() => {
    console.log('bookmarkRenderCost', bookmarkRenderCost);
}, 10000);

export default function BookmarkButton({
    event,
    mutedColor,
    iconSize = 24,
    bookmarkedByUser,
}: BookmarkProps) {
    const start = performance.now();

    const bookmark = useCallback(async () => {
        if (bookmarkedByUser) return;
        const bookmarkEvent = new NDKEvent(event.ndk, {
            kind: 3006,
            tags: [['k', event.kind.toString()]],
        } as NostrEvent);
        bookmarkEvent.tag(event);
        bookmarkEvent.publish();
    }, [event.id, bookmarkedByUser]);

    const end = performance.now();
    bookmarkRenderCost += end - start;
    
    return (
        <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={bookmark}>
                <Bookmark
                    size={iconSize}
                    fill={bookmarkedByUser ? 'red' : 'transparent'}
                    color={bookmarkedByUser ? 'red' : mutedColor}
                />
            </TouchableOpacity>
        </View>
    )
}