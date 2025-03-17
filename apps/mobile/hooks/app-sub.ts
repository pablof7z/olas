import { useRef, useEffect } from 'react';
import { NDKKind, NDKSubscriptionCacheUsage, useNDK } from '@nostr-dev-kit/ndk-mobile';
import * as SecureStore from 'expo-secure-store';
import { mainKinds } from '@/utils/const';
import { useReactionsStore } from '@/stores/reactions';
import { usePaymentStore } from '@/stores/payments';
import { useUserFlareStore } from './user-flare';
import { useObserver } from './observer';

export function useAppSub(pubkey: string | null, dependencies: any[]) {
    const addReactionEvents = useReactionsStore((state) => state.addEvents);
    const addPayments = usePaymentStore((state) => state.addPayments);
    const setUserFlare = useUserFlareStore((state) => state.setFlare);
    const { ndk } = useNDK();

    const processedPubkeyRef = useRef(new Set<string>());
    const olas365events = useObserver([{ kinds: [20], '#t': ['olas365'] }]);

    useEffect(() => {
        olas365events.forEach((event) => {
            if (processedPubkeyRef.current.has(event.pubkey)) return;
            processedPubkeyRef.current.add(event.pubkey);
            setUserFlare(event.pubkey, 'olas365');
        });
    }, [olas365events]);

    const eventFetched = useRef(0);
    useEffect(() => {
        if (!pubkey) return;
        const timeSinceLastAppSync = SecureStore.getItem('timeSinceLastAppSync');
        const sinceFilter = timeSinceLastAppSync ? { since: parseInt(timeSinceLastAppSync), limit: 1 } : {};

        const kindString = Array.from(mainKinds).map((k) => k.toString());

        const filters = [
            { kinds: [NDKKind.Text], '#k': kindString, authors: [pubkey], ...sinceFilter },
            { kinds: [NDKKind.GenericReply], '#K': kindString, '#p': [pubkey] },
            { kinds: [NDKKind.GenericRepost], '#k': kindString, '#p': [pubkey], ...sinceFilter },
            { kinds: [NDKKind.Reaction], '#k': kindString, '#p': [pubkey], ...sinceFilter },
            { kinds: [NDKKind.EventDeletion], '#k': kindString, authors: [pubkey], ...sinceFilter },
            // { authors: [user.pubkey], limit: 100 },
        ];

        const appSub = ndk.subscribe(
            filters,
            { cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY, groupable: false, skipVerification: true, subId: 'main-sub' },
            undefined,
            false
        );

        appSub.on('event', (event) => {
            addReactionEvents([event], pubkey);
            addPayments([event]);
            eventFetched.current++;
        });

        appSub.on('eose', () => {
            const time = Math.floor(Date.now() / 1000);
            SecureStore.setItem('timeSinceLastAppSync', time.toString());
        });

        setTimeout(() => {
            const cachedEvents = appSub.start(false);
            if (cachedEvents) {
                addReactionEvents(cachedEvents, pubkey);
                addPayments(cachedEvents);
            }
        }, 10000);
    }, dependencies);
}
