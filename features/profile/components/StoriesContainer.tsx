import EventMediaContainer from '@/components/media/event';
import { useObserver } from '@nostr-dev-kit/ndk-hooks';
import { router } from 'expo-router';
import type React from 'react';
import { useCallback } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';

type StoriesContainerProps = {
    pubkey: string;
};

const StoriesContainer: React.FC<StoriesContainerProps> = ({ pubkey }) => {
    const latestOlas365 = useObserver(
        [{ '#t': ['olas365'], authors: [pubkey], limit: 1 }],
        { wrap: true, skipVerification: true, cacheUnconstrainFilter: [] },
        [pubkey]
    );

    const handleOpenStories = useCallback(() => {
        router.push(`/365?pubkey=${pubkey}`);
    }, [pubkey]);

    if (!latestOlas365.length) return null;

    return (
        <View
            style={{
                marginHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
            }}
        >
            <TouchableOpacity
                style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                onPress={handleOpenStories}
            >
                <View
                    style={{
                        flexDirection: 'row',
                        gap: 10,
                        width: 40,
                        height: 40,
                        borderRadius: 40,
                        overflow: 'hidden',
                    }}
                >
                    <EventMediaContainer
                        event={latestOlas365[0]}
                        width={40}
                        singleMode
                        onPress={handleOpenStories}
                        height={40}
                        contentFit="cover"
                        maxWidth={Dimensions.get('window').width}
                        maxHeight={Dimensions.get('window').width}
                        priority="high"
                    />
                </View>
                <Text style={{ fontSize: 12, color: 'gray' }}>#olas365</Text>
            </TouchableOpacity>
        </View>
    );
};

export default StoriesContainer;
