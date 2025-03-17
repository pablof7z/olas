import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import {
    NDKKind,
    NDKRelaySet,
    NDKSubscriptionCacheUsage,
    NostrEvent,
    useNDK,
    useNDKCurrentUser,
    useSubscribe,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { MediaSection } from '@/components/events/Post';
import { useAppSettingsStore } from '@/stores/app';
import { atom, useAtom, useSetAtom } from 'jotai';
import { useEnableNotifications, useNotificationPermission } from '@/hooks/notifications';

const opts = { cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE, closeOnEose: true };

const eventForPromptAtom = atom<NDKEvent | null, [NDKEvent | null], void>(null, (get, set, event) => {
    set(eventForPromptAtom, event);
});

export function PromptForNotifications() {
    const promptedForNotifications = useAppSettingsStore((state) => state.promptedForNotifications);
    const notificationsPrompted = useAppSettingsStore((state) => state.notificationsPrompted);
    const currentUser = useNDKCurrentUser();
    const [eventForPrompt, setEventForPrompt] = useAtom(eventForPromptAtom);
    const permissionStatus = useNotificationPermission();

    const { events } = useSubscribe(currentUser ? [{ kinds: [NDKKind.Image], authors: [currentUser.pubkey], limit: 1 }] : false, opts);

    useEffect(() => {
        if (!currentUser || promptedForNotifications || permissionStatus === 'granted') return;

        if (events.length > 0) {
            setEventForPrompt(events[0]);
        }
    }, [currentUser, promptedForNotifications, notificationsPrompted, events, permissionStatus]);

    const visible = useMemo(
        () => !!eventForPrompt && !promptedForNotifications && permissionStatus !== 'granted',
        [promptedForNotifications, eventForPrompt, permissionStatus]
    );

    return (
        <EnableNotificationsModal
            visible={visible}
            onClose={() => {
                notificationsPrompted();
                setEventForPrompt(null);
            }}
            event={eventForPrompt}
        />
    );
}

const EnableNotificationsModal = ({ visible, onClose, event }: { visible: boolean; onClose: () => void; event: NDKEvent }) => {
    const [isLoading, setIsLoading] = useState(false);
    const enableNotifications = useEnableNotifications();

    const requestPermissions = async () => {
        setIsLoading(true);
        await enableNotifications();
        setIsLoading(false);
        onClose();
    };

    if (!event) return null;

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    }}>
                    <MediaSection event={event} setActiveEvent={() => {}} />
                </View>

                <View style={styles.modalBox}>
                    <Text style={styles.title}>Track your posts?</Text>
                    <Text style={styles.description}>Want to receive notifications when your post receives comments?</Text>
                    <TouchableOpacity style={[styles.button, styles.enableButton]} onPress={requestPermissions} disabled={isLoading}>
                        <Text style={styles.buttonText}>Enable Notifications</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={onClose} disabled={isLoading}>
                        <Text style={styles.buttonText}>Skip for Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalBox: {
        width: '85%',
        padding: 24,
        borderRadius: 12,
        backgroundColor: '#1E1E1E',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: '#B0B0B0',
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    enableButton: {
        backgroundColor: '#4CAF50',
    },
    skipButton: {
        backgroundColor: '#555555',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default EnableNotificationsModal;
