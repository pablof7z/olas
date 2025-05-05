import { type NDKEvent, NDKKind, NDKList, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { type NDKEventWithFrom, useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks';

import { useEffect, useRef } from 'react';

import { useUserFlareStore } from '@/lib/user/stores/flare';
import { usePaymentStore } from '@/stores/payments';
import { useReactionsStore } from '@/stores/reactions';
import { mainKinds } from '@/utils/const';

const sessionKinds = new Map([
    [NDKKind.BlossomList, { wrapper: NDKList }],
    [NDKKind.SimpleGroupList, { wrapper: NDKList }],
] as [NDKKind, { wrapper: NDKEventWithFrom<any> }][]);

// export function useSessionSub() {
//     const { ndk } = useNDK();
//     const currentUser = useNDKCurrentUser();
//     const [appReady, setAppReady] = useAtom(appReadyAtom);
//     const timeoutRef = useRef(null);

//     useEffect(() => {
//         if (!currentUser) return;
//         if (!currentUser?.pubkey) return;

//         startSession(
//             ndk!,
//             currentUser,
//             {
//                 follows: true,
//                 muteList: true,
//                 events: sessionKinds,
//                 subOpts: { wrap: true, skipVerification: true },
//                 signer: ndk!.signer
//             }
//         );
//     }, [currentUser?.pubkey, appReady]);
// }

export function useAppSub() {
    const currentUser = useNDKCurrentUser();
    const pubkey = currentUser?.pubkey;
    const addReactionEventsRef = useRef(useReactionsStore.getState().addEvents);
    const addReactionEvents = addReactionEventsRef.current;
    const addPayments = usePaymentStore((state) => state.addPayments);
    const setUserFlares = useUserFlareStore((state) => state.setFlares);
    const setUserFlare = useUserFlareStore((state) => state.setFlare);
    const { ndk } = useNDK();

    const processedEventsRef = useRef(new Set<string>()); // Track processed event IDs

    useEffect(() => {
        if (!ndk) return;

        const processedPubkeys = new Set<string>();

        ndk.subscribe(
            [{ '#t': ['olas365'] }],
            { cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE, skipVerification: true },
            {
                onEvents: (events) => {
                    for (const event of events) {
                        processedPubkeys.add(event.pubkey);
                    }
                    setUserFlares(Array.from(processedPubkeys), 'olas365');
                },
                onEvent: (event) => {
                    if (processedPubkeys.has(event.pubkey)) return;
                    processedPubkeys.add(event.pubkey);
                    setUserFlare(event.pubkey, 'olas365');
                },
            }
        );
    }, [ndk]);

    // useEffect(() => {
    //     for (const event of olas365events) {
    //         if (processedPubkeyRef.current.has(event.pubkey)) return;
    //         processedPubkeyRef.current.add(event.pubkey);
    //         setUserFlare(event.pubkey, "olas365");
    //     }
    // }, [olas365events.length]);

    const eventsToAdd = useRef<NDKEvent[]>([]);

    useEffect(() => {
        if (!ndk || !pubkey) return;
        const kindString = Array.from(mainKinds).map((k) => k.toString());

        const filters = [
            { kinds: [NDKKind.Text], '#k': kindString, authors: [pubkey] },
            { kinds: [NDKKind.GenericReply], '#K': kindString, '#p': [pubkey] },
            { kinds: [NDKKind.GenericRepost], '#k': kindString, '#p': [pubkey] },
            { kinds: [NDKKind.Reaction], '#k': kindString, '#p': [pubkey] },
            { kinds: [NDKKind.EventDeletion], '#k': kindString, authors: [pubkey] },
        ];

        const appSub = ndk.subscribe(
            filters,
            {
                groupable: false,
                skipVerification: true,
                addSinceFromCache: true,
                subId: 'main-sub',
            },
            {
                onEvents: (events) => {
                    for (const event of events) {
                        if (processedEventsRef.current.has(event.id)) continue;
                        processedEventsRef.current.add(event.id);
                        eventsToAdd.current.push(event);
                    }
                },
                onEvent: (event) => {
                    if (processedEventsRef.current.has(event.id)) return;
                    processedEventsRef.current.add(event.id);
                    eventsToAdd.current.push(event);
                },
                onEose: () => {
                    addReactionEvents(eventsToAdd.current, pubkey);
                    addPayments(eventsToAdd.current);
                    eventsToAdd.current = [];

                    const time = Math.floor(Date.now() / 1000);
                },
            }
        );

        setTimeout(() => {
            const cachedEvents = appSub.start(false);
            if (cachedEvents) {
                // Filter out already processed events from cache processing
                const newEvents = cachedEvents.filter(
                    (event) => !processedEventsRef.current.has(event.id)
                );
                for (const event of newEvents) processedEventsRef.current.add(event.id);

                if (newEvents.length > 0) {
                    addReactionEvents(newEvents, pubkey);
                    addPayments(newEvents);
                }
            }
        }, 10000);
    }, [pubkey, ndk]);
}
