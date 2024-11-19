import React, { useMemo } from 'react';
import { View } from 'react-native';
import { ListItem } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';
import { useSubscribe } from '@/ndk-expo';
import { NDKSimpleGroupMetadata, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { Icon } from '@roninoss/icons';
import Swipeable from '@/components/ui/Swipable';
import { cn } from '~/lib/cn';
import { Avatar, AvatarImage } from '~/components/nativewindui/Avatar';
import { RenderTarget } from '@shopify/flash-list';

type GroupRowProps = {
    groupMetadata: NDKSimpleGroupMetadata;
    onPress: () => void;
    index: number;
    target: RenderTarget;
};

const TEXT_STYLE = {
    paddingRight: 96,
};

export default function GroupRow({ groupMetadata, onPress, index, target }: GroupRowProps) {
    const { colors } = useColorScheme();

    const groupId = groupMetadata.dTag;
    const filters = useMemo(() => [{ kinds: [30023], '#h': [groupId!] }], []);
    const opts = useMemo(() => ({ cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY }), []);
    const { events: groupEvents } = useSubscribe({ filters, opts });

    const mostRecentEvent = useMemo(() => groupEvents.sort((a, b) => a.created_at! - b.created_at!).pop(), [groupEvents]);

    const imageUrl = groupMetadata.picture;
    const name = groupMetadata.name ?? groupId;

    const item = useMemo(
        () => ({
            item: groupMetadata,
            index,
            target,
            title: name,
            subTitle: groupMetadata.dTag,
        }),
        [groupMetadata, index, target, name, mostRecentEvent?.content]
    );

    const messageCount = useMemo(() => groupEvents.length, [groupEvents]);

    return (
        <Swipeable isUnread={true}>
            <ListItem
                item={item}
                textNumberOfLines={1}
                subTitleNumberOfLines={1}
                onLongPress={noop}
                onPress={onPress}
                className={cn('h-[88px]', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
                titleStyle={TEXT_STYLE}
                titleClassName="font-medium text-lg"
                leftView={
                    <View className="ios:border-b dark:border-border/80 h-12 flex-1 flex-row items-center border-border px-3 py-3 pl-2">
                        {imageUrl ? (
                            <Avatar className="h-12 w-12 rounded-lg">
                                <AvatarImage
                                    source={{
                                        uri: imageUrl,
                                    }}
                                />
                            </Avatar>
                        ) : (
                            <View className="h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                                <Icon name="plus" size={14} color={colors.grey} />
                            </View>
                        )}
                    </View>
                }
                rightView={
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            height: '100%',
                        }}>
                        <View className="flex-row items-center">
                            <Text className="text-sm text-muted-foreground">{messageCount > 0 ? messageCount : ''}</Text>
                        </View>
                        <View className="pr-3">
                            <Icon name="chevron-right" size={14} color={colors.grey} />
                        </View>
                    </View>
                }></ListItem>
        </Swipeable>
    );
}

function noop() {}
