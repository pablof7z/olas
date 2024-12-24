import { NDKEvent, NDKKind, useNDKSessionEvents, useSubscribe, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { Stack } from 'expo-router';
import { memo, useMemo } from 'react';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import * as User from '~/components/ui/user';
import RelativeTime from './components/relative-time';
import { FlashList } from '@shopify/flash-list';
import { useDebounce, useThrottle } from '@uidotdev/usehooks';

type NotificationItem = {
    id: string;
    type: 'like' | 'follow' | 'comment' | 'mention';
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
            case (NDKKind.Text, 22):
                return 'commented on your post';
            case 967:
                return 'followed you';
        }
    }, [event.kind]);

    return (
        <TouchableOpacity style={styles.notificationItem} className="border-b border-border">
            <User.Avatar userProfile={userProfile} alt={event.pubkey} size={44} style={styles.avatar} />

            <View style={styles.content}>
                <Text>
                    <User.Name userProfile={userProfile} pubkey={event.pubkey} style={styles.username} /> {label}
                </Text>
                <Text style={styles.timestamp} className="text-muted-foreground">
                    <RelativeTime timestamp={event.created_at} />
                </Text>
            </View>
        </TouchableOpacity>
    );
});

export default function Notifications() {
    const { currentUser } = useNDK();
    const events = useNDKSessionEvents([967 as NDKKind, NDKKind.Reaction]);
    const filters = useMemo(
        () => [
            { kinds: [NDKKind.Text], '#k': ['20'], '#p': [currentUser?.pubkey] },
            { kinds: [22], '#K': ['20'], '#p': [currentUser?.pubkey] },
            { kinds: [NDKKind.Reaction], '#k': ['20'], '#p': [currentUser?.pubkey] },
            { kinds: [NDKKind.Reaction], '#K': ['20'], '#p': [currentUser?.pubkey] },
        ],
        [currentUser?.pubkey]
    );
    const opts = useMemo(() => ({ closeOnEose: false, groupable: false }), [filters]);
    const { events: notifications } = useSubscribe({ filters, opts });

    const mixedEvents = useThrottle([events, notifications], 1000);
    const sortedEvents = useMemo(() => [...events, ...notifications].sort((a, b) => b.created_at - a.created_at), [mixedEvents]);
    // const mixedEvents = useDebounce(() => [...events, ...notifications].sort((a, b) => a.created_at - b.created_at), 1000);

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Notifications' }} />
            <View style={styles.container} className="bg-card">
                <FlashList data={sortedEvents} renderItem={({ item }) => <NotificationItem event={item} />} keyExtractor={(item) => item.id} />
            </View>
        </>
    );
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
        marginTop: 4,
    },
});
