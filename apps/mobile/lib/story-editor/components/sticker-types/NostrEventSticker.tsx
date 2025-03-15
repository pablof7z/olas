import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '../../context/StickerContext';
import EventContent from '@/components/ui/event/content';
import { NDKEvent, useNDK, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import * as User from '@/components/ui/user';
import { getNostrEventStickerStyleById } from '../../styles/nostrEventStickerStyles';

interface NostrEventStickerProps {
    sticker: Sticker;
    textStyle?: any;
}

export default function NostrEventSticker({ sticker, textStyle }: NostrEventStickerProps) {
    const { ndk } = useNDK();
    const [event, setEvent] = useState<NDKEvent | null>(null);
    const [loading, setLoading] = useState(true);
    
    const style = getNostrEventStickerStyleById(sticker.styleId);
    const finalTextStyle = { ...style.style.text, ...textStyle };
    const iconColor = finalTextStyle.color || 'white';
    
    // Get layout options from the style, with defaults
    const layout = style.layout || {
        direction: 'row',
        avatarSize: 48,
        avatarPosition: 'left',
        gap: 8,
    };
    
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
    
    // Determine content width if specified
    const contentWidth = layout.contentWidth || (layout.direction === 'row' ? 240 : 280);
    
    return (
        <View style={[
            style.style.container,
            {
                flexDirection: layout.direction,
                gap: layout.gap,
            }
        ]}>
            {event?.pubkey && (
                <User.Avatar 
                    pubkey={event.pubkey}
                    userProfile={userProfile}
                    imageSize={layout.avatarSize}
                    style={styles.icon}
                />
            )}
            {loading ? (
                <ActivityIndicator size="small" color={iconColor} style={styles.loader} />
            ) : event ? (
                <View style={[styles.contentWrapper, { width: contentWidth }]}>
                    <EventContent 
                        event={event}
                        style={[finalTextStyle, style.fontFamily ? { fontFamily: style.fontFamily } : {}]} 
                        numberOfLines={3}
                    />
                </View>
            ) : (
                <Animated.Text style={[finalTextStyle, style.fontFamily ? { fontFamily: style.fontFamily } : {}]}>
                    {sticker.content}
                </Animated.Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    icon: {
        marginRight: 0, // This will be controlled by the gap in container
    },
    loader: {
        marginLeft: 8,
    },
    contentWrapper: {
        flex: 1,
        marginLeft: 0, // This will be controlled by the gap in container
    }
}); 