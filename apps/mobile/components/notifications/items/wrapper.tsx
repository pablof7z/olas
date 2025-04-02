import {
    type NDKEvent,
    NDKKind,
    getRootEventId,
    useNDK,
    useProfile,
} from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { useSetAtom } from 'jotai';
import { MailOpen, Reply } from 'lucide-react-native';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Text } from '@/components/nativewindui/Text';
import RelativeTime from '@/components/relative-time';
import EventContent from '@/components/ui/event/content';
import * as User from '@/components/ui/user';
import { useCommentBottomSheet } from '@/lib/comments/bottom-sheet';
import { activeEventAtom } from '@/stores/event';

export function NotificationContainer({
    event,
    label,
    children,
}: { event: NDKEvent; label: string; children: React.ReactNode }) {
    const { ndk } = useNDK();
    const userProfile = useProfile(event.pubkey);

    const setActiveEvent = useSetAtom(activeEventAtom);

    const onPress = useCallback(() => {
        const taggedEventId = event.getMatchingTags('E')[0] || event.getMatchingTags('e')[0];
        if (taggedEventId) {
            ndk?.fetchEventFromTag(taggedEventId, event).then((event) => {
                if (!event) return;
                setActiveEvent(event);
                router.push('/view');
            });
        } else {
        }
    }, [event]);

    const onAvatarPress = useCallback(() => {
        router.push(`/profile?pubkey=${event.pubkey}`);
    }, [event.pubkey]);

    return (
        <Swipeable renderRightActions={() => <RightActions event={event} />}>
            <View
                style={styles.notificationItem}
                className="flex flex-row gap-2 border-b border-border bg-card"
            >
                <TouchableOpacity onPress={onAvatarPress}>
                    <User.Avatar pubkey={event.pubkey} userProfile={userProfile} imageSize={44} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onPress} className="flex-1">
                    <View style={styles.content}>
                        <View className="mb-2 flex-row items-center justify-between">
                            <Text variant="caption1" className="text-foreground">
                                <User.Name
                                    userProfile={userProfile}
                                    pubkey={event.pubkey}
                                    style={styles.username}
                                />{' '}
                                {label}
                            </Text>
                            <Text style={styles.timestamp} className="text-muted-foreground">
                                <RelativeTime timestamp={event.created_at} />
                            </Text>
                        </View>
                        {children ? (
                            children
                        ) : event.kind === NDKKind.GenericRepost ? (
                            <></>
                        ) : (
                            event.content.length > 0 && (
                                <EventContent className="text-foreground" event={event} />
                            )
                        )}
                    </View>
                </TouchableOpacity>
            </View>
        </Swipeable>
    );
}

function RightActions({ event }: { event: NDKEvent }) {
    const { ndk } = useNDK();
    const openComment = useCommentBottomSheet();

    const handleOpen = useCallback(() => {
        const rootId = getRootEventId(event);
        const fetchedEvents = rootId ? ndk?.fetchEventSync([{ ids: [rootId] }]) : null;
        const rootEvent = fetchedEvents && fetchedEvents.length > 0 ? fetchedEvents[0] : null;
        const openEvent = rootEvent || event;
        openComment(openEvent, openEvent.id !== event.id ? event : undefined);
    }, [event?.id]);

    return (
        <TouchableOpacity style={styles.rightAction} onPress={handleOpen}>
            <MailOpen size={18} color="white" />
            <Text className="text-xs text-white">Reply</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    rightAction: {
        width: 75,
        height: '100%',
        backgroundColor: 'purple',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
    },

    notificationItem: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 0.5,
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
