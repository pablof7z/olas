import { NDKKind, useFollows, useNDKCurrentUser, useSubscribe } from "@nostr-dev-kit/ndk-mobile"
import { FlashList, RenderTarget } from "@shopify/flash-list";
import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
import { ListItem } from "@/components/nativewindui/List";
import * as User from "@/components/ui/user";
import { useCallback, useMemo } from "react";
import { useUserProfile } from "@/hooks/user-profile";
import EventContent from "@/components/ui/event/content";

const blacklistedKinds = new Set([
    NDKKind.Contacts
]);

export default function EverythingScreen() {
    const currentUser = useNDKCurrentUser();
    const follows = useFollows();
    const { events } = useSubscribe(currentUser ? ([
        { kinds: [1111], authors: follows }
    ]) : false, { closeOnEose: true }, [currentUser?.pubkey])

    const notFromUser = useCallback((event: NDKEvent) => {
        return event.pubkey !== currentUser?.pubkey;
    }, [currentUser?.pubkey])

    const notUnwantedKinds = (event: NDKEvent) => !blacklistedKinds.has(event.kind!)

    const filteredEvents = useMemo(() => {
        return events
            .filter(notFromUser)
            .filter(notUnwantedKinds)
    }, [events, notFromUser])

    return <FlashList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        estimatedItemSize={100}
        renderItem={({ item, index, target }) => <Item item={item} target={target} index={index} />}
    />
}

function Item({ item, target, index }: { item: NDKEvent, target: RenderTarget, index: number }) {
    // const { userProfile } = useUserProfile(item.pubkey);

    const rootKind = item.tagValue("K");

    const handleLongPress = () => {
        console.log(JSON.stringify(item.rawEvent(), null, 4))
    }

    return <ListItem
        // leftView={<User.Avatar pubkey={item.pubkey} imageSize={48} userProfile={userProfile} />}
        index={index}
        target={target}
        onLongPress={handleLongPress}
        item={{
            title: rootKind,
        }}
    >
        <EventContent event={item} />
    </ListItem>
}