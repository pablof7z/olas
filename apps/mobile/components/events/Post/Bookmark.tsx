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
     * Bookmarkions the user has made, if undefined and the currentUser is set, the user's reactions will be calculated locally
     */
    reactedByUser?: NDKEvent[] | undefined;
    
    /**
     * All reactions
     * 
     * If false, the number of reactions will not be shown
    */
    allBookmarkions?: NDKEvent[] | false;

    /**
     * Show reaction count
     */
    showBookmarkionCount?: boolean;

    /**
     * Muted color
     */
    mutedColor: string;

    /**
     * Icon size
     */
    iconSize?: number;

    /**
     * Current user
     */
    currentUser?: NDKUser;
}

export default function BookmarkButton({
    event,
    mutedColor,
    iconSize = 24,
    showBookmarkionCount = true,
    currentUser
}: BookmarkProps) {
    const allBookmarkions = useObserver([{ kinds: [3006 as NDKKind], ...event.filter()} ], [event.id])
    const reactedByUser = currentUser ? allBookmarkions?.filter(r => r.pubkey === currentUser.pubkey) : [];
    const isBookmarkedByUser = reactedByUser && reactedByUser.length > 0;

    const bookmark = useCallback(async () => {
            const bookmarkEvent = new NDKEvent(event.ndk, {
                kind: 3006,
                tags: [['k', event.kind.toString()]],
            } as NostrEvent);
            bookmarkEvent.tag(event);
            bookmarkEvent.publish();
    }, [event.id, isBookmarkedByUser]);
    
    return (
        <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={bookmark}>
                <Bookmark
                    size={iconSize}
                    fill={isBookmarkedByUser ? 'red' : 'transparent'}
                    color={isBookmarkedByUser ? 'red' : mutedColor}
                />
            </TouchableOpacity>
        </View>
    )
}