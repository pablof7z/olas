import type { NDKImetaTag } from '@nostr-dev-kit/ndk';
import { View } from 'react-native';
import type { EventMediaProps } from './event';
import MediaComponent from './media';

export default function EventMedia3ItemsContainer({
    imetas,
    width,
    height,
    maxWidth,
    maxHeight,
    priority,
    onPress,
}: {
    imetas: NDKImetaTag[];
    width: number;
    height: number;
    maxWidth: number;
    maxHeight: number;
    priority?: EventMediaProps['priority'];
    onPress?: EventMediaProps['onPress'];
}) {
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
            <View style={{ flex: 1, marginBottom: 1, overflow: 'hidden' }}>
                <MediaComponent
                    imeta={imetas[0]}
                    maxWidth={maxWidth}
                    maxHeight={typeof maxHeight === 'number' ? maxHeight / 2 : maxHeight}
                    onPress={onPress}
                    priority={priority}
                />
            </View>
            <View style={{ flexDirection: 'row', flex: 1 }}>
                <View style={{ width, marginRight: 0.5, flex: 1, overflow: 'hidden' }}>
                    <MediaComponent
                        imeta={imetas[1]}
                        style={{ flex: 1, marginRight: 0.5 }}
                        maxWidth={typeof maxWidth === 'number' ? maxWidth / 2 - 1 : maxWidth}
                        maxHeight={typeof maxHeight === 'number' ? maxHeight / 2 : maxHeight}
                        onPress={onPress}
                        priority={priority}
                    />
                </View>
                <View
                    style={{
                        width,
                        marginLeft: 0.5,
                        flex: 1,
                        overflow: 'hidden',
                        backgroundColor: 'green',
                    }}
                >
                    <MediaComponent
                        imeta={imetas[2]}
                        style={{ flex: 1, marginLeft: 0.5 }}
                        maxWidth={typeof maxWidth === 'number' ? maxWidth / 2 : maxWidth}
                        maxHeight={typeof maxHeight === 'number' ? maxHeight / 2 : maxHeight}
                        onPress={onPress}
                        priority={priority}
                    />
                </View>
            </View>
        </View>
    );
}
