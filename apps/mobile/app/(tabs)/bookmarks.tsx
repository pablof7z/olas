import { useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import { useNDKSessionEventKind } from '@nostr-dev-kit/ndk-mobile';
import { NDKList } from '@nostr-dev-kit/ndk-mobile';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { FlashList } from '@shopify/flash-list';
import { useEffect, useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import * as User from '@/components/ui/user';
import Post from '@/components/events/Post';
import { Text } from '@/components/nativewindui/Text';
import { Album } from 'lucide-react-native';

export default function Bookmarks() {
    const imageCurationSet = useNDKSessionEventKind<NDKList>(NDKList, NDKKind.ImageCurationSet, { create: true });

    useEffect(() => {
        console.log(
            'imageCurationSet',
            imageCurationSet.items.map((i) => i[1])
        );
    }, [imageCurationSet.items]);

    const filters = useMemo(() => [{ ids: imageCurationSet.items.map((i) => i[1]) }], [imageCurationSet.items.length]);
    const { events } = useSubscribe({ filters });

    return (
        <View className="flex-1 gap-2 bg-card">
            {imageCurationSet.items.length === 0 && (
                <View className="flex-1 items-center justify-center">
                    <Album size={Dimensions.get('window').width / 2} strokeWidth={1} color="gray" style={{ opacity: 0.5 }} />
                    <Text>Nothing in bookmarks</Text>
                </View>
            )}
            <FlashList
                data={events}
                renderItem={({ item }) => (
                    <User.Profile pubkey={item.pubkey}>
                        <Post event={item} />
                    </User.Profile>
                )}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
}
