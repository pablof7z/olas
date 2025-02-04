import { NDKEvent, NDKKind, NDKUser, useNDK, useNDKCurrentUser, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { router, Stack } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '@/components/nativewindui/Button';
import * as User from '~/components/ui/user';
import RelativeTime from './components/relative-time';
import { FlashList } from '@shopify/flash-list';
import { SegmentedControl } from '@/components/nativewindui/SegmentedControl';
import { atom, useAtom, useSetAtom } from 'jotai';
import EventContent from '@/components/ui/event/content';
import { useEnableNotifications, useNotificationPermission, useNotifications } from '@/hooks/notifications';
import { useAppSettingsStore } from '@/stores/app';
import { activeEventAtom } from '@/stores/event';

type NotificationItem = {
    id: string;
    type: 'follow' | 'comment' | 'mention' | 'reaction' | 'bookmark';
    user: {
        username: string;
        avatar: string;
    };
    timestamp: string;
    content?: string;
};

function getLabelForCommentNotification(event: NDKEvent, currentUser: NDKUser) {
    if (event.kind === NDKKind.GenericReply) {
        // if the current user is in the P tag
        if (event.tagValue("P") === currentUser?.pubkey) return "commented on your post";
        else if (event.tagValue("p") === currentUser?.pubkey) return "replied to your comment";
        return "replied";
    }

    return "replied to your post";
}

const NotificationItem = memo(({ event, currentUser }: { event: NDKEvent, currentUser: NDKUser }) => {
    const { userProfile } = useUserProfile(event.pubkey);

    const label = useMemo(() => {
        switch (event.kind) {
            case NDKKind.GenericRepost:
                return 'reposted you';
            case NDKKind.Reaction:
                return 'reacted to your post';
            case NDKKind.Text: case NDKKind.GenericReply:
                return getLabelForCommentNotification(event, currentUser);
            case NDKKind.Nutzap:
                return 'zapped you';
            case 3006:
                return 'bookmarked your post';
            case 967:
                return 'followed you';
            default:
                return event.kind.toString();
        }
    }, [event.id, currentUser.pubkey]);

    const { ndk } = useNDK();
    const setActiveEvent = useSetAtom(activeEventAtom);
    
    const onPress = useCallback(() => {
        console.log(JSON.stringify(event.rawEvent(), null, 2));
        const taggedEventId =  event.getMatchingTags('E')[0]|| event.getMatchingTags('e')[0];
        if (taggedEventId) {
            ndk.fetchEventFromTag(taggedEventId, event)
                .then((event) => {
                    console.log('result', event);
                    if (!event) return;
                    setActiveEvent(event);
                    router.push(`/view`);
                })
        } else {
            console.log(JSON.stringify(event.rawEvent(), null, 2));
        }
    }, [event]);

    const onAvatarPress = useCallback(() => {
        router.push(`/profile?pubkey=${event.pubkey}`);
    }, [event.pubkey]);
    
    return (
        <View style={styles.notificationItem} className="flex flex-row gap-2 border-b border-border">
            <TouchableOpacity onPress={onAvatarPress}>
                <User.Avatar pubkey={event.pubkey} userProfile={userProfile} imageSize={44} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onPress} className="flex-1">
                <View style={styles.content}>
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-foreground">
                            <User.Name userProfile={userProfile} pubkey={event.pubkey} style={styles.username} /> {label}
                        </Text>
                        <Text style={styles.timestamp} className="text-muted-foreground">
                            <RelativeTime timestamp={event.created_at} />
                        </Text>
                    </View>
                    {event.kind === NDKKind.GenericRepost ? (
                        <></>
                    ) : (
                        event.content.length > 0 && <EventContent className="text-foreground" event={event} />
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
});

const settingsTabAtom = atom('all');

const replyKinds = new Set([NDKKind.GenericReply, NDKKind.Text]);
const replyFilter = (event: NDKEvent) => replyKinds.has(event.kind);

const reactionFilter = (event: NDKEvent) => event.kind === NDKKind.Reaction;

export default function Notifications() {
    const [settingsTab, setSettingsTab] = useAtom(settingsTabAtom);
    const currentUser = useNDKCurrentUser();
    const notifications = useNotifications(false);
    const selectedIndex = useMemo(() => {
        switch (settingsTab) {
            case 'all': return 0;
            case 'replies': return 1;
            case 'reactions': return 2;
            case 'zaps': return 3;
        }
    }, [settingsTab]);

    const notificationsFilter = useMemo(() => {
        const excludeOwn = (event: NDKEvent) => event.pubkey !== currentUser?.pubkey;
        if (settingsTab === 'all') {
            return (event: NDKEvent) => excludeOwn(event);
        } else if (settingsTab === 'replies') {
            return (event: NDKEvent) => replyFilter(event) && excludeOwn(event);
        } else if (settingsTab === 'zaps') {
            return (event: NDKEvent) => [NDKKind.Nutzap, NDKKind.Zap].includes(event.kind) && excludeOwn(event);
        } else {
            return (event: NDKEvent) => reactionFilter(event) && excludeOwn(event);
        }
    }, [settingsTab, currentUser?.pubkey]);

    const sortedEvents = useMemo(
        () => {
            // fond index that is null
            return [...notifications]
                .filter(notificationsFilter)
                .sort((a, b) => b.created_at - a.created_at);
        },
        [notifications.length, notificationsFilter]
    );

    // when the user views the notifications screen, we should mark all notifications as read
    const markNotificationsAsSeen = useAppSettingsStore(s => s.notificationsSeen)
    useEffect(() => {
        markNotificationsAsSeen();
    }, []);

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Notifications'}} />
            <View style={styles.container} className="bg-card">
                <NotificationPrompt />
                <SegmentedControl
                    values={['All', 'Replies', 'Reactions', 'Zaps']}
                    selectedIndex={selectedIndex}
                    onIndexChange={(index) => {
                        switch (index) {
                            case 0: setSettingsTab('all'); break;
                            case 1: setSettingsTab('replies'); break;
                            case 2: setSettingsTab('reactions'); break;
                            case 3: setSettingsTab('zaps'); break;
                        }
                    }}
            />
                <FlashList
                    data={sortedEvents}
                    renderItem={({ item }) => <NotificationItem event={item} currentUser={currentUser} />}
                    keyExtractor={(item) => item.id}
                />
            </View>
        </>
    );
}

function NotificationPrompt() {
    const permissionStatus = useNotificationPermission();
    const enableNotifications = useEnableNotifications();
    const [acted, setActed] = useState(false);

    if (permissionStatus === 'granted' || acted) return null;

    async function enable() {
        if (await enableNotifications()) {
            setActed(true);
        }
    }

    return (<TouchableOpacity className='bg-muted-200 p-4' onPress={enable}>
        <Text className='text-muted-foreground'>Want to know when people follow you in Olas or comments on your posts?</Text>
        <View className='flex-col gap-2 items-center'>
            <Text className="text-primary">Enable</Text>
        </View>
    </TouchableOpacity>)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 0.5,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    username: {
        fontWeight: 'bold',
    },
    timestamp: {
        fontSize: 12,
        marginBottom: 4,
    },
});
