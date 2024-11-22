import { NDKEvent, NDKKind, useNDK, useSubscribe } from '@nostr-dev-kit/ndk-mobile'
import { Stack } from 'expo-router'
import { memo, useMemo } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import * as User from '~/components/ui/user';
import RelativeTime from './components/relative-time';

type NotificationItem = {
    id: string
    type: 'like' | 'follow' | 'comment' | 'mention'
    user: {
        username: string
        avatar: string
    }
    timestamp: string
    content?: string
}

const NotificationItem = memo(({ event }: { event: NDKEvent }) => {
    const label = useMemo(() => {
        switch (event.kind) {
            case NDKKind.Reaction: return 'reacted to your post';
            case NDKKind.Text, 22: return 'commented on your post';
        }
    }, [event.kind]);
    
    return <TouchableOpacity style={styles.notificationItem}>
        <User.Profile pubkey={event.pubkey}>
            <User.Avatar size={44} style={styles.avatar} />

            <View style={styles.content}>
                <Text>
                    <User.Name style={styles.username} />{' '}
                    {label}
                </Text>
                <Text style={styles.timestamp}>
                    <RelativeTime timestamp={event.created_at} />
                </Text>
            </View>
        </User.Profile>
    </TouchableOpacity>
});

export default function Notifications() {
    const { currentUser } = useNDK();
    const filters = useMemo(() => ([
        { kinds: [NDKKind.Text], "#k": ["20"], "#p": [currentUser?.pubkey] },
        { kinds: [22], "#K": ["20"], "#p": [currentUser?.pubkey] },
        { kinds: [NDKKind.Reaction], "#k": ["20"], "#p": [currentUser?.pubkey] },
        { kinds: [NDKKind.Reaction], "#K": ["20"], "#p": [currentUser?.pubkey] }
    ]), [currentUser?.pubkey]);
    const opts = useMemo(() => ({ closeOnEose: false, groupable: false }), [filters]);
    const { events } = useSubscribe({ filters, opts });

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: 'Notifications' }} />
            <View style={styles.container}>
                <FlatList
                    data={events}
                    renderItem={({ item }) => <NotificationItem event={item} />}
                    keyExtractor={item => item.id}
                />
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee'
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12
    },
    content: {
        flex: 1,
        justifyContent: 'center'
    },
    username: {
        fontWeight: 'bold'
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        marginTop: 4
    }
})
