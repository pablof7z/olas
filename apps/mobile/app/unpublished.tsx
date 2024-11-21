import { LargeTitleHeader } from '@/components/nativewindui/LargeTitleHeader';
import { List, ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import { UnpublishedEventEntry, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { TouchableOpacity, View } from 'react-native';
import { RenderTarget } from '@shopify/flash-list';
import NDK, { NDKUser } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';

const renderItem = (ndk: NDK, entry: UnpublishedEventEntry, index: number, target: RenderTarget) => {
    const discard = () => {
        ndk?.cacheAdapter?.discardUnpublishedEvent?.(entry.event.id);
    };

    return (
        <ListItem
            item={{
                title: `Kind ${entry.event.kind}`,
                subTitle: entry.relays?.join(', '), //user.npub.slice(0, 10)
            }}
            index={index}
            target={target}
            rightView={
                <TouchableOpacity onPress={discard}>
                    <Text className="pr-4 text-primary">Discard</Text>
                </TouchableOpacity>
            }
        />
    );
};

export default function Unpublished() {
    const { ndk, unpublishedEvents } = useNDK();

    const discardAll = () => {
        for (let entry of unpublishedEvents.values()) {
            ndk?.cacheAdapter?.discardUnpublishedEvent?.(entry.event.id);
        }

        router.back();
    };

    return (
        <View className="flex-1">
            <LargeTitleHeader
                title="Unpublished events"
                leftView={() => (
                    <TouchableOpacity onPress={discardAll}>
                        <Text className="text-primary">Discard All</Text>
                    </TouchableOpacity>
                )}
                rightView={() => (
                    <TouchableOpacity>
                        <Text className="text-primary">Publish All</Text>
                    </TouchableOpacity>
                )}
            />

            <List
                data={Array.from(unpublishedEvents.values())}
                keyExtractor={(i) => i.event.id}
                renderItem={(info) => renderItem(ndk, info.item, info.index, info.target)}
            />
        </View>
    );
}
