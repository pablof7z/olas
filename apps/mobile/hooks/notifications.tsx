import {
    NDKEvent,
    NDKKind,
    NDKPrivateKeySigner,
    NDKRelaySet,
    type NostrEvent,
    useNDK,
    useNDKCurrentUser,
} from '@nostr-dev-kit/ndk-mobile';
import { useNDKCurrentPubkey, useObserver } from '@nostr-dev-kit/ndk-hooks';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { useAppSettingsStore } from '@/stores/app';
import { WALLET_ENABLED, mainKinds } from '@/utils/const';

const kindString = Array.from(mainKinds).map((k) => k.toString());

export function useNotifications(onlyNew = false) {
    const seenNotificationsAt = useAppSettingsStore((s) => s.seenNotificationsAt);
    const currentPubkey = useNDKCurrentPubkey();

    const events = useObserver(
        currentPubkey
            ? [
                  { kinds: [NDKKind.Text], '#p': [currentPubkey] },
                  { kinds: [NDKKind.GenericReply], '#K': kindString, '#p': [currentPubkey] },
                  { kinds: [NDKKind.Reaction, NDKKind.GenericRepost], '#k': ['20'], '#p': [currentPubkey], },
                  { kinds: [3006 as NDKKind, 967 as NDKKind], '#p': [currentPubkey] },
                  ...[
                      WALLET_ENABLED ? { kinds: [NDKKind.Nutzap], '#p': [currentPubkey] } : {},
                  ],
              ]
            : false,
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
    const currentPubkey = useNDKCurrentUser();
    return useCallback(async () => {
        if (!currentPubkey) return;

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
                pubkey: currentPubkey,
            }),
            tags: [['p', olas.pubkey]],
        } as NostrEvent);
        await event.encrypt(olas, signer);
        await event.sign(signer);

        event.publish(olasRelay);
    }, [ndk]);
}
