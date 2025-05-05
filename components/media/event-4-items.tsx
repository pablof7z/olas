import type { NDKImetaTag } from '@nostr-dev-kit/ndk';
import { View } from 'react-native';
import type { EventMediaProps } from './event';
import MediaComponent from './media';

export default function EventMedia4ItemsContainer({
    imetas,
    maxWidth,
    maxHeight,
    priority,
    onPress,
}: {
    maxWidth: number;
    maxHeight: number;
    imetas: NDKImetaTag[];
    priority?: EventMediaProps['priority'];
    onPress?: EventMediaProps['onPress'];
}) {
    const width = maxWidth / 2 - 1;
    const height = maxHeight / 2 - 0.5;

    return (
        <View
            style={{
                width: maxWidth,
                height: maxHeight,
                overflow: 'hidden',
                flex: 1,
                paddingHorizontal: 1,
                borderRadius: 20,
            }}
        >
            <View style={{ width: '100%', flexDirection: 'row', flex: 1, marginBottom: 1 }}>
                <View style={{ width, height, marginRight: 0.5, flex: 1, overflow: 'hidden' }}>
                    <MediaComponent
                        imeta={imetas[0]}
                        style={{ flex: 1 }}
                        maxWidth={width}
                        maxHeight={height}
                        contentFit="cover"
                        onPress={onPress}
                        priority={priority}
                    />
                </View>
                <View style={{ width, height, marginLeft: 0.5, flex: 1, overflow: 'hidden' }}>
                    <MediaComponent
                        imeta={imetas[1]}
                        style={{ flex: 1 }}
                        contentFit="cover"
                        maxWidth={width}
                        maxHeight={height}
                        onPress={onPress}
                        priority={priority}
                    />
                </View>
            </View>
            <View
                style={{
                    width: '100%',
                    height: maxHeight,
                    flexDirection: 'row',
                    overflow: 'hidden',
                    flex: 1,
                }}
            >
                <View style={{ width, height, marginRight: 0.5, flex: 1, overflow: 'hidden' }}>
                    <MediaComponent
                        imeta={imetas[2]}
                        style={{ flex: 1 }}
                        maxWidth={width}
                        maxHeight={height}
                        onPress={onPress}
                        priority={priority}
                    />
                </View>
                <View style={{ width, height, marginLeft: 0.5, flex: 1, overflow: 'hidden' }}>
                    <MediaComponent
                        imeta={imetas[3]}
                        style={{ flex: 1 }}
                        maxWidth={width}
                        maxHeight={height}
                        onPress={onPress}
                        priority={priority}
                    />
                </View>
            </View>
        </View>
    );
}
