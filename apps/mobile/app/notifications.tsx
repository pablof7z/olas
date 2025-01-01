import { NDKEvent, NDKKind, NDKSubscriptionCacheUsage, useNDK, useNDKSessionEvents, useSubscribe, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { router, Stack } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '@/components/nativewindui/Button';
import * as User from '~/components/ui/user';
import RelativeTime from './components/relative-time';
import { FlashList } from '@shopify/flash-list';
import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { SegmentedControl } from '@/components/nativewindui/SegmentedControl';
import { atom, useAtom, useStore } from 'jotai';
import EventContent from '@/components/ui/event/content';
import { useEnableNotifications, useNotificationPermission, useNotifications } from '@/hooks/notifications';
import { useAppSettingsStore } from '@/stores/app';
import { activeEventStore } from './stores';

type NotificationItem = {
    id: string;
    type: 'follow' | 'comment' | 'mention' | 'reaction';
    user: {
        username: string;
        avatar: string;
    };
    timestamp: string;
    content?: string;
};

const NotificationItem = memo(({ event }: { event: NDKEvent }) => {
    const { userProfile } = useUserProfile(event.pubkey);

    const label = useMemo(() => {
        switch (event.kind) {
            case NDKKind.Reaction:
                return 'reacted to your post';
            case NDKKind.Text: case NDKKind.GenericReply:
                return 'commented on your post';
            case 967:
                return 'followed you';
            default:
                return event.kind.toString();
        }
    }, [event.kind]);

    const { ndk } = useNDK();
    const setActiveEvent = activeEventStore(state => state.setActiveEvent);
    
    const onPress = useCallback(() => {
        const taggedEventId = event.getMatchingTags('e')[0];
        if (taggedEventId) {
            ndk.fetchEventFromTag(taggedEventId, event)
                .then((event) => {
                    console.log(event.rawEvent());
                    setActiveEvent(event);
                    router.push(`/view`);
                });
        }
    }, [event]);
    
    return (
        <TouchableOpacity style={styles.notificationItem} className="border-b border-border" onPress={onPress}>
            <User.Avatar userProfile={userProfile} alt={event.pubkey} size={44} style={styles.avatar} />

            <View style={styles.content}>
                <View className="flex-row items-center justify-between mb-2">
                    <Text>
                        <User.Name userProfile={userProfile} pubkey={event.pubkey} style={styles.username} /> {label}
                    </Text>
                    <Text style={styles.timestamp} className="text-muted-foreground">
                        <RelativeTime timestamp={event.created_at} />
                    </Text>
                </View>
                {event.content.length > 0 && <EventContent event={event} />}
            </View>
        </TouchableOpacity>
    );
});

const settingsTabAtom = atom('replies');

const replyKinds = new Set([NDKKind.GenericReply, NDKKind.Text]);
const replyFilter = (event: NDKEvent) => replyKinds.has(event.kind);

const reactionFilter = (event: NDKEvent) => event.kind === NDKKind.Reaction;

export default function Notifications() {
    const currentUser = useNDKCurrentUser();
    const [settingsTab, setSettingsTab] = useAtom(settingsTabAtom);
    const notifications = useNotifications();
    const permissionStatus = useNotificationPermission();
    const selectedIndex = useMemo(() => {
        switch (settingsTab) {
            case 'all': return 0;
            case 'replies': return 1;
            case 'reactions': return 2;
        }
    }, [settingsTab]);
    const notificationsFilter = useMemo(() => {
        if (settingsTab === 'all') {
            return (event: NDKEvent) => true;
        } else if (settingsTab === 'replies') {
            return replyFilter;
        } else {
            return reactionFilter;
        }
    }, [settingsTab]);

    const sortedEvents = useMemo(
        () => {
            return [...notifications]
                .filter(notificationsFilter)
                .filter((event) => event.kind !== 967 || event.pubkey !== currentUser?.pubkey)
                .sort((a, b) => b.created_at - a.created_at);
        },
        [notifications, notificationsFilter]
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
                    values={['All', 'Replies', 'Reactions']}
                    selectedIndex={selectedIndex}
                    onIndexChange={(index) => {
                        setSettingsTab(index === 0 ? 'all' : index === 1 ? 'replies' : 'reactions');
                    }}
            />
                <FlashList
                    data={sortedEvents}
                    renderItem={({ item }) => <NotificationItem event={item} />}
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
        <Button variant="plain">
            <Text className="text-primary">Enable</Text>
        </Button>
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
