import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '../../context/StickerContext';
import EventContent from '@/components/ui/event/content';
import { NDKEvent, useNDK, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import * as User from '@/components/ui/user';

interface NostrEventStickerProps {
    sticker: Sticker;
    textStyle: any;
}

export default function NostrEventSticker({ sticker, textStyle }: NostrEventStickerProps) {
    const { ndk } = useNDK();
    const [event, setEvent] = useState<NDKEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const iconColor = textStyle.color || 'white';
    
    useEffect(() => {
        const eventId = sticker.metadata?.eventId;
        if (!eventId || !ndk) return;
        
        const fetchEvent = async () => {
            try {
                const fetchedEvent = await ndk.fetchEvent(eventId);
                setEvent(fetchedEvent);
            } catch (error) {
                console.error('Error fetching event:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchEvent();
    }, [sticker.metadata?.eventId, ndk]);

    const { userProfile } = useUserProfile(event?.pubkey);
    
    return (
        <View style={styles.container}>
            {event?.pubkey && (
                <User.Avatar 
                    pubkey={event.pubkey}
                    userProfile={userProfile}
                    imageSize={48}
                    style={styles.icon}
                />
            )}
            {loading ? (
                <ActivityIndicator size="small" color={iconColor} style={styles.loader} />
            ) : event ? (
                <View style={styles.contentWrapper}>
                    <EventContent 
                        event={event}
                        style={[textStyle, styles.text]} 
                        numberOfLines={3}
                    />
                </View>
            ) : (
                <Animated.Text style={[textStyle, styles.text]}>
                    {sticker.content}
                </Animated.Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        width: 300,
        maxWidth: 300,
    },
    icon: {
        marginRight: 8,
    },
    text: {
        fontSize: 24,
    },
    loader: {
        marginLeft: 8,
    },
    contentWrapper: {
        flex: 1,
        marginLeft: 8,
        width: 300
    }
}); 