import { type NDKEvent, NDKKind, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { FlashList } from '@shopify/flash-list';
import { Stack } from 'expo-router';
import { atom, useAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

import { SegmentedControl } from '@/components/nativewindui/SegmentedControl';
import { Text } from '@/components/nativewindui/Text';
import NotificationItem from '@/components/notifications/items';
import {
    useEnableNotifications,
    useNotificationPermission,
    useNotifications,
} from '@/hooks/notifications';
import { useAppSettingsStore } from '@/stores/app';
import { WALLET_ENABLED } from '@/utils/const';

const settingsTabAtom = atom('all');

const replyKinds = new Set([NDKKind.GenericReply, NDKKind.Text]);
const replyFilter = (event: NDKEvent) => replyKinds.has(event.kind);

const reactionFilter = (event: NDKEvent) => event.kind === NDKKind.Reaction;

const segmentOptions = ['All', 'Replies', 'Reactions'];

if (WALLET_ENABLED) segmentOptions.push('Zaps');

export default function Notifications() {
    const [settingsTab, setSettingsTab] = useAtom(settingsTabAtom);
    const currentUser = useNDKCurrentUser();
    const notifications = useNotifications(false);
    const selectedIndex = useMemo(() => {
        switch (settingsTab) {
            case 'all':
                return 0;
            case 'replies':
                return 1;
            case 'reactions':
                return 2;
            case 'zaps':
                return 3;
        }
    }, [settingsTab]);

    const notificationsFilter = useMemo(() => {
        const excludeOwn = (event: NDKEvent) => event.pubkey !== currentUser?.pubkey;
        if (settingsTab === 'all') {
            return (event: NDKEvent) => excludeOwn(event);
        } else if (settingsTab === 'replies') {
            return (event: NDKEvent) => replyFilter(event) && excludeOwn(event);
        } else if (settingsTab === 'zaps') {
            return (event: NDKEvent) =>
                [NDKKind.Nutzap, NDKKind.Zap].includes(event.kind) && excludeOwn(event);
        } else {
            return (event: NDKEvent) => reactionFilter(event) && excludeOwn(event);
        }
    }, [settingsTab, currentUser?.pubkey]);

    const sortedEvents = useMemo(() => {
        // fond index that is null
        return [...notifications]
            .filter(notificationsFilter)
            .sort((a, b) => b.created_at - a.created_at);
    }, [notifications.length, notificationsFilter]);

    // when the user views the notifications screen, we should mark all notifications as read
    const markNotificationsAsSeen = useAppSettingsStore((s) => s.notificationsSeen);
    useEffect(() => {
        markNotificationsAsSeen();
    }, []);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1250);
    }, [notifications]);

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Notifications' }} />
            <View style={styles.container} className="bg-card">
                <NotificationPrompt />
                <SegmentedControl
                    values={segmentOptions}
                    selectedIndex={selectedIndex}
                    onIndexChange={(index) => {
                        switch (index) {
                            case 0:
                                setSettingsTab('all');
                                break;
                            case 1:
                                setSettingsTab('replies');
                                break;
                            case 2:
                                setSettingsTab('reactions');
                                break;
                            case 3:
                                setSettingsTab('zaps');
                                break;
                        }
                    }}
                />
                <FlashList
                    data={sortedEvents}
                    renderItem={({ item }) => (
                        <NotificationItem event={item} currentUser={currentUser} />
                    )}
                    keyExtractor={(item) => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
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

    return (
        <TouchableOpacity className="bg-muted-200 p-4" onPress={enable}>
            <Text className="text-muted-foreground">
                Want to know when people follow you in Olas or comments on your posts?
            </Text>
            <View className="flex-col items-center gap-2">
                <Text className="text-primary">Enable</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
