import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { ListItem, ListRenderItemInfo } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';
import { useSubscribe } from '@/ndk-expo';
import { NDKFilter, NDKList, NDKSimpleGroupMetadata, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { Icon } from '@roninoss/icons';
import Swipeable from '@/components/ui/Swipable';
import { cn } from '~/lib/cn';
import { RenderTarget } from '@shopify/flash-list';

type ListItemProps = {
    list: NDKList;
    onPress: () => void;
    index: number;
    target: RenderTarget;
};

const TEXT_STYLE = {
    paddingRight: 96,
};

export default function List({ list, onPress, index, target }: ListItemProps) {
    const { colors } = useColorScheme();

    const listId = list.id;
    const pTags = useMemo(() => list.items
        .filter((item) => item[0] === 'p')
        .map((item) => item[1]), [list.items]);
    const tTags = useMemo(() => list.items
        .filter((item) => item[0] === 't')
        .map((item) => item[1]), [list.items]);
    const filters = useMemo(() => {
        const f: NDKFilter[] = [];
        if (pTags.length > 0) f.push({ kinds: [1], "authors": pTags, limit: 1 });
        if (tTags.length > 0) f.push({ kinds: [1], "#t": tTags, limit: 1 });
        return f;
    }, [ pTags, tTags ]);

    const opts = useMemo(() => ({ cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY, }), []);
    const { events: listEvents } = useSubscribe({ filters, opts });

    const mostRecentEvent = useMemo(() => listEvents.sort((a, b) => a.created_at! - b.created_at!).pop(), [listEvents]);

    const name = list.title ?? list.dTag;

    const item = useMemo(() => ({
        item: list,
        index,
        target,
        title: name,
        subTitle: mostRecentEvent?.content,
    }), [list, index, target, name, mostRecentEvent?.content]);

    const messageCount = useMemo(() => listEvents.length, [listEvents]);

    return (
        <Swipeable isUnread={true}>
            <ListItem
                item={item}
                textNumberOfLines={1}
                subTitleNumberOfLines={1}
                onLongPress={noop}
                onPress={onPress}
                className={cn(
                    'h-[88px]',
                    index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                )}
                titleStyle={TEXT_STYLE}
                titleClassName="font-medium text-lg"
                leftView={
                    <View className="flex-1 flex-row items-center px-3 py-3 pl-2 h-12 ios:border-b border-border dark:border-border/80">
                        <View className="w-12 h-12 bg-gray-200 rounded-lg items-center justify-center">
                            <Icon name="plus" size={14} color={colors.grey} />
                        </View>
                    </View>
                }
                rightView={
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                        <View className="flex-row items-center">
                            <Text className="text-muted-foreground text-sm">
                                {messageCount > 0 ? messageCount : ''}
                            </Text>
                        </View>
                        <View className="pr-3">
                            <Icon name="chevron-right" size={14} color={colors.grey} />
                        </View>
                    </View>
                }
            >
            </ListItem>
        </Swipeable>
    );
}

function noop() {}
