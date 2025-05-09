import {
    NDKKind,
    NDKList,
    useNDK,
    useNDKSessionEvent,
    useSubscribe,
} from '@nostr-dev-kit/ndk-mobile';
import { FlashList } from '@shopify/flash-list';
import { Stack } from 'expo-router';
import { useSetAtom } from 'jotai';
import { Album, Globe } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Pressable, View } from 'react-native';

import Post from '@/components/events/Post';
import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { activeEventAtom } from '@/stores/event';

export default function Bookmarks() {
    const { ndk } = useNDK();
    const imageCurationSet = useNDKSessionEvent<NDKList>(NDKKind.ImageCurationSet, {
        create: NDKList,
    });
    const [showOthers, setShowOthers] = useState(false);
    const [bookmarkLists, setBookmarkLists] = useState<NDKList[]>([]);

    useEffect(() => {
        if (ndk && showOthers) {
            ndk.fetchEvents([{ kinds: [NDKKind.ImageCurationSet] }]).then((lists) => {
                setBookmarkLists(Array.from(lists).map(NDKList.from));
            });
        } else {
            setBookmarkLists([]);
        }
    }, [showOthers]);

    const otherBookmarkIds = useMemo(
        () =>
            Array.from(
                new Set(bookmarkLists?.flatMap((list) => list.items).map((item) => item[1]) ?? [])
            ),
        [bookmarkLists]
    );

    const filters = useMemo(
        () => [
            {
                ids: [...imageCurationSet.items.map((i) => i[1]), ...otherBookmarkIds].filter(
                    (id) => !!id
                ),
            },
        ],
        [imageCurationSet.items.length, otherBookmarkIds]
    );

    const { events } = useSubscribe(filters, {}, [filters]);

    const sortedEvents = useMemo(
        () => events.sort((a, b) => b.created_at - a.created_at),
        [events]
    );
    const setActiveEvent = useSetAtom(activeEventAtom);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Bookmarks',
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', paddingRight: 10 }}>
                            <Pressable onPress={() => setShowOthers(!showOthers)}>
                                <Globe size={24} strokeWidth={showOthers ? 3 : 1} color="gray" />
                            </Pressable>
                        </View>
                    ),
                }}
            />
            <View className="flex-1 flex-col gap-2 bg-card">
                {imageCurationSet.items.length === 0 && showOthers === false && (
                    <View
                        className="flex-1 flex-col items-center justify-center gap-4"
                        style={{ paddingHorizontal: Dimensions.get('window').width * 0.2 }}
                    >
                        <Album
                            size={Dimensions.get('window').width / 2}
                            strokeWidth={1}
                            color="gray"
                            style={{ opacity: 0.5 }}
                        />
                        <Text>Your favorite posts will appear here once you bookmark them.</Text>

                        <Button variant="tonal" onPress={() => setShowOthers(!showOthers)}>
                            <Text>View others' bookmarks</Text>
                        </Button>
                    </View>
                )}
                <FlashList
                    data={sortedEvents}
                    renderItem={({ item }) => (
                        <Post
                            event={item}
                            reposts={[]}
                            timestamp={item.created_at}
                            setActiveEvent={setActiveEvent}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 30 }}
                />
            </View>
        </>
    );
}
