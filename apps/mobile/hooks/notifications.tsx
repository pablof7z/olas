import { useAppSettingsStore } from "@/stores/app";
import { NDKEvent, NDKRelaySet, NDKSubscriptionCacheUsage, NostrEvent, useNDK, useNDKCurrentUser, useSubscribe } from "@nostr-dev-kit/ndk-mobile";
import { NDKKind } from "@nostr-dev-kit/ndk-mobile";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from "@/lib/notifications";
const opts = { cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE, closeOnEose: true };

export function useNotifications(onlyNew = false) {
    const seenNotificationsAt = useAppSettingsStore(s => s.seenNotificationsAt);
    const currentUser = useNDKCurrentUser();

    const filters = useMemo(() => {
        if (!currentUser) return;

        return [
            { kinds: [NDKKind.Text], '#p': [currentUser.pubkey] },
            { kinds: [NDKKind.GenericReply  ], '#K': [NDKKind.Image.toString()], '#p': [currentUser.pubkey] },
            { kinds: [NDKKind.Reaction, NDKKind.GenericRepost], '#k': ['20'], '#p': [currentUser.pubkey] },
            { kinds: [3006, 967], '#p': [currentUser.pubkey] },
            { kinds: [NDKKind.Nutzap], "#p": [currentUser.pubkey] },
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


export function useNotificationPermission() {
    const [ permissionStatus, setPermissionStatus ] = useState<Notifications.PermissionStatus | null>(null);

    useEffect(() => {
        const checkPermissions = async () => {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            setPermissionStatus(existingStatus);
        }
        checkPermissions();
    }, []);

    return permissionStatus;
}

export function useEnableNotifications() {
    const { ndk } = useNDK();
    
    return useCallback(async () => {
        const token = await registerForPushNotificationsAsync();
        if (!token) return false;
        console.log('Push Notification Token:', token);

        const olasRelay = NDKRelaySet.fromRelayUrls(['wss://relay.olas.app'], ndk);
        const olas = ndk.getUser({ npub: 'npub10lasj0tuxuweddwhmucwnm6l458flnu6mqwk38meaxs5matjg4ssac0ywa' })
        const event = new NDKEvent(ndk, {
            kind: 10901,
            content: token,
            tags: [
                ['p', olas.pubkey],
            ]
        } as NostrEvent)
        await event.encrypt(olas)

        event.publish(olasRelay);
        console.log('Registered push notification token:', JSON.stringify(event.rawEvent(), null, 4));
    }, [ndk]);
}