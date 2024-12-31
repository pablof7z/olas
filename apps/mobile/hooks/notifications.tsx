import { useAppSettingsStore } from "@/stores/app";
import { NDKSubscriptionCacheUsage, useNDK, useNDKCurrentUser, useSubscribe } from "@nostr-dev-kit/ndk-mobile";
import { NDKKind } from "@nostr-dev-kit/ndk-mobile";
import { useMemo } from "react";

const opts = { cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE, closeOnEose: true };

export function useNotifications(onlyNew = false) {
    const seenNotificationsAt = useAppSettingsStore(s => s.seenNotificationsAt);
    const currentUser = useNDKCurrentUser();

    const filters = useMemo(() => {
        if (!currentUser) return;

        return [
            { kinds: [NDKKind.Text], '#p': [currentUser?.pubkey] },
            { kinds: [NDKKind.GenericReply], '#K': [NDKKind.Image.toString()], '#p': [currentUser?.pubkey] },
            { kinds: [NDKKind.Reaction], '#k': ['20'], '#p': [currentUser?.pubkey] },
        ];
    }, [currentUser]);

    const { events } = useSubscribe({ filters, opts });

    const filteredNotifications = useMemo(() => {
        if (onlyNew && seenNotificationsAt > 0) {
            return events.filter(e => e.created_at > seenNotificationsAt);
        }
        return events;
    }, [events, onlyNew, seenNotificationsAt]);

    return filteredNotifications;
}
