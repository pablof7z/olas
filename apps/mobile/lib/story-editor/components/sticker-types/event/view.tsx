import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '@/lib/story-editor/store';
import { NDKKind, NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { getStickerStyle } from '@/lib/story-editor/styles/stickerStyles';
import eventStyles from './styles';
import { NDKEvent, useNDK, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { useColorScheme } from '@/lib/useColorScheme';
import Generic from './generic';
import Kind30402 from './kind30402';

interface EventStickerViewProps {
    sticker: Sticker;
}

export default function EventStickerView({ sticker }: EventStickerViewProps) {
    const eventId = sticker.value;
    
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

    const { ndk } = useNDK();

    const [ event, setEvent ] = useState<NDKEvent | null>(sticker.metadata?.event || null);
    const { userProfile } = useUserProfile(event?.pubkey);

    const { colors } = useColorScheme();

    useEffect(() => {
        if (!ndk || sticker?.metadata?.event || !eventId) return;
        const fetchEvent = async () => {
            const event = await ndk.fetchEvent(eventId);
            setEvent(event);
        };
        fetchEvent();
    }, [ndk, eventId, sticker.metadata?.event]);

    const renderEventContent = useCallback(() => {
        if (!event) return null;
        console.log(event.kind);
        switch (event.kind) {
            case NDKKind.Classified: return <Kind30402 event={event} userProfile={userProfile} textStyle={textStyle} />;
            default: return <Generic event={event} userProfile={userProfile} textStyle={textStyle} />
        }
    }, [event, textStyle]);
    
    return (
        <View style={containerStyle}>
            {event ? (
                <>
                    {renderEventContent()}
                </>
            ) : (
                <ActivityIndicator size="small" color={colors.foreground} />
            )}
        </View>
    );
}

