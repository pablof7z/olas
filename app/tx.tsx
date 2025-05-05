import {
    type Hexpubkey,
    NDKCashuWalletTx,
    type NDKEvent,
    type NDKTag,
    type NDKUser,
    useNDK,
    useNDKCurrentUser,
    wrapEvent,
} from '@nostr-dev-kit/ndk-mobile';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { UserAsHeader } from './send';

import Post from '@/components/events/Post';
import { Text } from '@/components/nativewindui/Text';
import { useActiveEventStore } from '@/components/wallet/store';

export default function TxView() {
    const currentUser = useNDKCurrentUser();
    const { activeEvent } = useActiveEventStore();
    const [event, setEvent] = useState<NDKEvent | null>(null);
    const [counterPart, setCounterPart] = useState<Hexpubkey | undefined>(undefined);
    const [records, setRecords] = useState<Record<string, string>>({});

    useEffect(() => {
        NDKCashuWalletTx.from(activeEvent).then((e) => {
            setEvent(e);

            const counterpart = getCounterPart(e, currentUser);
            if (counterpart) {
                setCounterPart(counterpart);
            }

            setRecords(getRecords(e));
        });
    }, []);

    if (!event) return null;

    return (
        <ScrollView className="flex-1 flex-col gap-10 p-4">
            {counterPart && <UserAsHeader pubkey={counterPart} />}
            <View>
                {Object.entries(records).map(([key, value]) => (
                    <View key={key} className="flex-row gap-2">
                        <Text className="w-1/3 font-mono font-bold">{key}: </Text>
                        <Text className="w-2/3 font-mono">{value}</Text>
                    </View>
                ))}
            </View>

            {event.getMatchingTags('e').map((tag, index) => (
                <TaggedEvent key={index} originalEvent={event} tag={tag} index={index} />
            ))}

            {/* <Text>{JSON.stringify(event?.rawEvent(), null, 2)}</Text> */}
        </ScrollView>
    );
}

function TaggedEvent({
    originalEvent,
    tag,
    index,
}: { originalEvent: NDKEvent; tag: NDKTag; index: number }) {
    const { ndk } = useNDK();
    const [taggedEvent, setTaggedEvent] = useState<NDKEvent | null>(null);
    const marker = tag[3];

    useEffect(() => {
        const fetch = tag[1];

        ndk.fetchEventFromTag(tag, originalEvent).then((e) => {
            if (e.tagId() !== fetch) {
                return;
            }

            setTaggedEvent(e);
        });
    }, [originalEvent, index]);

    if (marker === 'created' || marker === 'redeemed') return null;

    if (!taggedEvent) return null;

    if (marker === 'redeemed') {
        return (
            <View className="flex-col gap-2">
                <Text className="font-mono font-bold">Redeemed: </Text>
                <Text className="font-mono">{taggedEvent.id}</Text>
                <Text className="rounded-xl bg-card p-4 font-sans text-lg font-bold">
                    {taggedEvent.content}
                </Text>
            </View>
        );
    }

    const wrappedEvent = wrapEvent(taggedEvent);

    return (
        <View className="flex-col gap-2">
            {marker && <Text className="font-mono font-bold">{marker}: </Text>}
            <Post event={wrappedEvent} reposts={[]} index={0} timestamp={0} />
        </View>
    );
}

function getCounterPart(event: NDKCashuWalletTx, currentUser: NDKUser): Hexpubkey | undefined {
    const pTags = event.getMatchingTags('p');

    return pTags.find((tag) => tag[1] !== currentUser.pubkey)?.[1];
}

function getRecords(event: NDKCashuWalletTx): Record<string, string> {
    const res = {};

    for (const tag of event.tags) {
        if (tag[0].length > 1) {
            res[tag[0]] = tag[1];
        }
    }

    return res;
}
