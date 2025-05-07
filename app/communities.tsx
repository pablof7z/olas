import {
    NDKEvent,
    NDKKind,
    NDKList,
    NDKRelaySet,
    useFollows,
    useNDK,
    useNDKCurrentUser,
    useNDKSessionEvent,
} from '@nostr-dev-kit/ndk-mobile';
import { Image } from 'expo-image';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { LargeTitleHeader } from '@/components/nativewindui/LargeTitleHeader';
import { List, ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import { cn } from '@/lib/cn';
import { useAllGroups } from '@/lib/groups/store';
import type { GroupEntry } from '@/lib/groups/types';
import { useThrottle } from '@/utils/debounce';
import AvatarGroup from '@/components/ui/user/AvatarGroup';

const relays = ['wss://groups.0xchat.com'];

export default function CommunitiesScreen() {
    const groups = useAllGroups(relays);

    const throttledGroups = useThrottle(groups, 100);
    const sortedGroups = useMemo(() => {
        return Array.from(throttledGroups).sort((a, b) => b.members.size - a.members.size);
    }, [throttledGroups]);

    return (
        <>
            <LargeTitleHeader title="Communities" />
            <List
                data={sortedGroups}
                keyExtractor={(item) => item.groupId}
                estimatedItemSize={52}
                variant="full-width"
                renderItem={({ item, index, target }) => (
                    <GroupListItem groupEntry={item} index={index} target={target} />
                )}
            />
        </>
    );
}

function GroupListItem({
    groupEntry,
    index,
    target,
}: { groupEntry: GroupEntry; index: number; target: any }) {
    const follows = useFollows();
    const membersToShow = useMemo(() => {
        // find the first 3 members that the user follows
        const members = Array.from(groupEntry.members).filter((m) => follows.has(m));
        return members.slice(0, 3);
    }, [groupEntry.members?.size, follows.size]);

    return (
        <ListItem
            item={{
                title: groupEntry.name ?? "",
                subTitle: groupEntry.about,
            }}
            subTitleNumberOfLines={1}
            leftView={
                <View className="mt-8 h-full flex-row items-start gap-2">
                    <Image
                        source={{ uri: groupEntry.picture }}
                        style={{ width: 32, height: 32, borderRadius: 100, marginHorizontal: 10 }}
                    />
                </View>
            }
            rightView={<RightViewItem groupEntry={groupEntry} />}
            className={cn(
                'ios:pl-0 pr-2',
                index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
            )}
            titleClassName="text-lg"
            index={index}
            target={target}
        >
            <View className="mt-4 w-full flex-row items-center gap-2">
                {membersToShow.length > 0 && (
                    <AvatarGroup pubkeys={membersToShow} avatarSize={20} threshold={3} />
                )}
                <Text className="text-sm text-muted-foreground">
                    {groupEntry.members?.size} members
                </Text>
            </View>
        </ListItem>
    );
}

function RightViewItem({ groupEntry }: { groupEntry: GroupEntry }) {
    const currentUser = useNDKCurrentUser();
    const isMember = currentUser && groupEntry.members.has(currentUser.pubkey);
    const { ndk } = useNDK();
    const groupList = useNDKSessionEvent<NDKList>(NDKKind.SimpleGroupList, { create: NDKList });

    const join = useCallback(
        async (groupEntry: GroupEntry) => {
            const joinReq = new NDKEvent(ndk);
            joinReq.kind = NDKKind.GroupAdminRequestJoin;
            joinReq.tags.push(['h', groupEntry.groupId]);
            const relaySet = NDKRelaySet.fromRelayUrls(groupEntry.relayUrls, ndk);
            joinReq.publish(relaySet);

            await groupList.addItem(['group', groupEntry.groupId, ...groupEntry.relayUrls]);
            groupList.publish();
        },
        [ndk]
    );

    if (isMember) return null;

    return (
        <Button variant="secondary" size="sm" onPress={() => join(groupEntry)}>
            <Text>Join</Text>
        </Button>
    );
}
