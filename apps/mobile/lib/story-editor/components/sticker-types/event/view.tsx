import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '@/lib/story-editor/store';
import { NDKStoryStickerType } from '@/lib/story-editor/types';
import { getStickerStyle } from '@/lib/story-editor/styles/stickerStyles';
import eventStyles from './styles';
import EventContent from '@/components/ui/event/content';
import { NDKEvent, useNDK, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import * as User from '@/components/ui/user';

interface EventStickerViewProps {
    sticker: Sticker;
}

export default function EventStickerView({ sticker }: EventStickerViewProps) {
    const eventId = sticker.metadata?.eventId || '';
    const shortEventId = eventId.substring(0, 8) + '...';
    
    // Get the selected style or default to the first one if not set
    const selectedStyle = getStickerStyle(NDKStoryStickerType.Event, sticker.styleId) || eventStyles[0];
    
    // Create container styles based on the selected style
    const containerStyle = {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        padding: 10,
        backgroundColor: selectedStyle.backgroundColor || 'rgba(0, 0, 0, 0.5)',
        borderRadius: selectedStyle.borderRadius || 16,
        borderWidth: selectedStyle.borderWidth,
        borderColor: selectedStyle.borderColor,
        borderStyle: selectedStyle.borderStyle as any,
        shadowColor: selectedStyle.shadowColor,
        shadowOffset: selectedStyle.shadowOffset,
        shadowOpacity: selectedStyle.shadowOpacity,
        shadowRadius: selectedStyle.shadowRadius,
        elevation: selectedStyle.elevation,
    };
    
    // Create text styles based on the selected style
    const textStyle = {
        color: selectedStyle.color || 'white',
        fontSize: selectedStyle.fontSize || 16,
        fontWeight: selectedStyle.fontWeight || 'bold',
        fontStyle: selectedStyle.fontStyle as any,
        textShadowColor: selectedStyle.textShadowColor,
        textShadowOffset: selectedStyle.textShadowOffset,
        textShadowRadius: selectedStyle.textShadowRadius,
    };
    
    // Icon color from the style
    const iconColor = selectedStyle.iconColor || 'white';

    const { ndk } = useNDK();

    const [ event, setEvent ] = useState<NDKEvent | null>(null);
    const { userProfile } = useUserProfile(event?.pubkey);

    useEffect(() => {
        if (!ndk || !eventId) return;
        const fetchEvent = async () => {
            const event = await ndk.fetchEvent(eventId);
            setEvent(event);
        };
        fetchEvent();
    }, [ndk, eventId]);
    
    return (
        <View style={containerStyle}>
            {event ? (
                <>
                        <View style={styles.userContainer}>
                            <User.Avatar 
                                pubkey={event.pubkey}
                                userProfile={userProfile}
                                imageSize={32}
                                style={styles.icon}
                            />
                            <User.Name 
                                userProfile={userProfile} 
                                pubkey={event.pubkey} 
                                style={textStyle}
                            />
                        </View>
                    <EventContent 
                        event={event}
                        style={textStyle}
                    />
                </>
            ) : (
                <Text style={textStyle}>
                    {sticker.content || `Event2: ${shortEventId}`}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 16,
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    icon: {
        marginRight: 6,
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 