import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { ListItem, ListRenderItemInfo } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';
import { useNDK } from '@/ndk-expo';
import {
    NDKUserProfile,
    NDKUser,
    NDKEvent,
    NDKEventId,
} from '@nostr-dev-kit/ndk';
import { useDebounce } from '@uidotdev/usehooks';
import { Icon } from '@roninoss/icons';
import Swipeable from '@/components/ui/Swipable';
import { cn } from '~/lib/cn';
import AvatarGroup from '@/ndk-expo/components/user/AvatarGroup';
import * as User from '@/ndk-expo/components/user';
import { RenderTarget } from '@shopify/flash-list';

export type Thread = {
    id: string;
    rootEventId: NDKEventId;
    events: NDKEvent[];
};

type ThreadItemProps = {
    thread: Thread;
    onPress?: () => void;
    index: number;
    target: RenderTarget;
};

const TEXT_STYLE = {
    paddingRight: 96,
};

const TIMESTAMP_CONTAINER_STYLE = {
    maxWidth: 96,
};

export default function ThreadItem({
    thread,
    onPress,
    index,
    target,
}: ThreadItemProps) {
    const { colors } = useColorScheme();

    const { ndk } = useNDK();
    const [userProfile, setUserProfile] = useState<NDKUserProfile | null>(null);
    const [item, setItem] = useState<ListRenderItemInfo<Thread>>({
        item: thread,
        index,
        target,
    });
    const rootEventId = useMemo(() => thread.rootEventId, [thread]);
    const events = useMemo(() => thread.events, [thread]);
    const rootEvent = useMemo(
        () =>
            rootEventId ? events.find((e) => e.id === rootEventId) : undefined,
        [events, rootEventId]
    );

    useEffect(() => {
        if (!ndk || !rootEvent) return;
        const fetchedUser = ndk.getUser({ pubkey: rootEvent.pubkey });
        fetchedUser.fetchProfile().then(setUserProfile);
    }, [ndk, rootEvent?.pubkey]);

    const mostRecentEvent = useMemo(
        () =>
            events
                ? events.sort((a, b) => a.created_at! - b.created_at!).pop()
                : undefined,
        [events]
    );

    const messageCount = useDebounce(events?.length, 1000);

    useEffect(() => {
        let title: string;
        if (rootEvent && rootEvent.id !== mostRecentEvent?.id) {
            title = rootEvent.content;
        } else {
            title = userProfile?.name ?? rootEventId;
        }
        setItem({
            ...item,
            title,
            subTitle: mostRecentEvent?.content ?? rootEvent?.content,
        });
    }, [userProfile, rootEvent]);

    if (!events || events.length === 0) {
        return null;
    }

    const timestamp = useMemo(() => {
        if (!mostRecentEvent) return '';
        return mostRecentEvent.created_at;
    }, [mostRecentEvent]);

    return (
        <Swipeable isUnread={true}>
            <ListItem
                item={item}
                textNumberOfLines={1}
                subTitleNumberOfLines={1}
                onLongPress={noop}
                onPress={onPress}
                className={cn(
                    'h-[94px]',
                    index === 0 &&
                        'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                )}
                titleStyle={TEXT_STYLE}
                titleClassName="font-medium text-base"
                subTitleClassName="pt-0.5"
                leftView={
                    <View className="flex-1 flex-row items-center px-3 py-3 pl-2">
                        {rootEvent ? (
                            <User.Profile pubkey={rootEvent?.pubkey}>
                                <User.Avatar className="h-12 w-12" alt="" />
                            </User.Profile>
                        ) : (
                            <View className="h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                                <Icon
                                    name="plus"
                                    size={14}
                                    color={colors.grey}
                                />
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
                            <Text className="text-sm text-muted-foreground">
                                {messageCount > 0 ? messageCount : ''}
                            </Text>
                        </View>
                        <View className="pr-3">
                            <Icon
                                name="chevron-right"
                                size={14}
                                color={colors.grey}
                            />
                        </View>
                    </View>
                }>
                <View className="h-6 flex-1 flex-row items-center pt-2">
                    <AvatarGroup events={events} avatarSize={6} threshold={5} />
                </View>
            </ListItem>
            <View
                style={TIMESTAMP_CONTAINER_STYLE}
                className="absolute right-8 top-1.5">
                <Text
                    numberOfLines={1}
                    variant="footnote"
                    className="text-muted-foreground">
                    {timestamp}
                </Text>
            </View>
        </Swipeable>
    );
}

function noop() {}
