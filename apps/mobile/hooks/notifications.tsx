import {
    NDKEvent,
    NDKKind,
    NDKPrivateKeySigner,
    NDKRelaySet,
    type NostrEvent,
    useNDK,
    useNDKCurrentUser,
    useObserver
} from '@nostr-dev-kit/ndk-mobile';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { useAppSettingsStore } from '@/stores/app';
import { WALLET_ENABLED, mainKinds } from '@/utils/const';

const kindString = Array.from(mainKinds).map((k) => k.toString());

export function useNotifications(onlyNew = false) {
    const seenNotificationsAt = useAppSettingsStore((s) => s.seenNotificationsAt);
    const currentUser = useNDKCurrentUser();

    const events = useObserver(
        currentUser
            ? [
                  { kinds: [NDKKind.Text], '#p': [currentUser.pubkey] },
                  { kinds: [NDKKind.GenericReply], '#K': kindString, '#p': [currentUser.pubkey] },
                  {
                      kinds: [NDKKind.Reaction, NDKKind.GenericRepost],
                      '#k': ['20'],
                      '#p': [currentUser.pubkey],
                  },
                  { kinds: [3006 as NDKKind, 967 as NDKKind], '#p': [currentUser.pubkey] },
                  ...[
                      WALLET_ENABLED ? { kinds: [NDKKind.Nutzap], '#p': [currentUser.pubkey] } : {},
                  ],
              ]
            : false,
        {},
        [!!currentUser]
    );

    const filteredNotifications = useMemo(() => {
        if (onlyNew && seenNotificationsAt > 0) {
            return events.filter((e) => !!e).filter((e) => e.created_at > seenNotificationsAt);
        }
        return events;
    }, [events?.length, onlyNew, seenNotificationsAt]);

    return filteredNotifications;
}

export function useNotificationPermission() {
    const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(
        null
    );

    useEffect(() => {
        const checkPermissions = async () => {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            setPermissionStatus(existingStatus);
        };
        checkPermissions();
    }, []);

    return permissionStatus;
}

export function useEnableNotifications() {
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    return useCallback(async () => {
        if (!currentUser) return;

        const token = await registerForPushNotificationsAsync();
        if (!token) return false;

        const signer = NDKPrivateKeySigner.generate();
        const olasRelay = NDKRelaySet.fromRelayUrls(['wss://relay.olas.app'], ndk);
        const olas = ndk.getUser({
            npub: 'npub10lasj0tuxuweddwhmucwnm6l458flnu6mqwk38meaxs5matjg4ssac0ywa',
        });
        const event = new NDKEvent(ndk, {
            kind: 10901,
            content: JSON.stringify({
                token,
                pubkey: currentUser.pubkey,
            }),
            tags: [['p', olas.pubkey]],
        } as NostrEvent);
        await event.encrypt(olas, signer);
        await event.sign(signer);

        event.publish(olasRelay);
    }, [ndk]);
}
