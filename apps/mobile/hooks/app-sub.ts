import {
    type NDKEvent,
    type NDKEventWithFrom,
    NDKKind,
    NDKList,
    NDKSubscriptionCacheUsage,
    useNDK,
    useNDKCurrentUser,
    useObserver,
} from "@nostr-dev-kit/ndk-mobile";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef } from "react";

import { useUserFlareStore } from "./user-flare";

import { usePaymentStore } from "@/stores/payments";
import { useReactionsStore } from "@/stores/reactions";
import { mainKinds } from "@/utils/const";

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
    const setUserFlare = useUserFlareStore((state) => state.setFlare);
    const { ndk } = useNDK();

    const processedPubkeyRef = useRef(new Set<string>());
    const processedEventsRef = useRef(new Set<string>()); // Track processed event IDs
    const olas365events = useObserver([{ kinds: [20], "#t": ["olas365"] }]);

    useEffect(() => {
        for (const event of olas365events) {
            if (processedPubkeyRef.current.has(event.pubkey)) return;
            processedPubkeyRef.current.add(event.pubkey);
            setUserFlare(event.pubkey, "olas365");
        }
    }, [olas365events]);

    const eventsToAdd = useRef<NDKEvent[]>([]);

    useEffect(() => {
        if (!ndk || !pubkey) return;
        const timeSinceLastAppSync = SecureStore.getItem("timeSinceLastAppSync");
        const sinceFilter = timeSinceLastAppSync ? { since: Number.parseInt(timeSinceLastAppSync), limit: 1 } : {};

        const kindString = Array.from(mainKinds).map((k) => k.toString());

        const filters = [
            { kinds: [NDKKind.Text], "#k": kindString, authors: [pubkey], ...sinceFilter },
            { kinds: [NDKKind.GenericReply], "#K": kindString, "#p": [pubkey] },
            { kinds: [NDKKind.GenericRepost], "#k": kindString, "#p": [pubkey], ...sinceFilter },
            { kinds: [NDKKind.Reaction], "#k": kindString, "#p": [pubkey], ...sinceFilter },
            { kinds: [NDKKind.EventDeletion], "#k": kindString, authors: [pubkey], ...sinceFilter },
        ];

        const appSub = ndk.subscribe(
            filters,
            {
                cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY,
                groupable: false,
                skipVerification: true,
                subId: "main-sub",
            },
            {
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
                    SecureStore.setItemAsync("timeSinceLastAppSync", time.toString());
                },
            },
        );

        setTimeout(() => {
            const cachedEvents = appSub.start(false);
            if (cachedEvents) {
                // Filter out already processed events from cache processing
                const newEvents = cachedEvents.filter((event) => !processedEventsRef.current.has(event.id));
                for (const event of newEvents) processedEventsRef.current.add(event.id);

                if (newEvents.length > 0) {
                    addReactionEvents(newEvents, pubkey);
                    addPayments(newEvents);
                }
            }
        }, 10000);
    }, [pubkey, ndk]);
}
