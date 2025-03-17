import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, ViewStyle } from 'react-native';
import { Sticker } from '@/lib/story-editor/store';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { EventStickerStyle, getStyleFromName } from './styles';
import { NDKEvent, useNDK, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { useColorScheme } from '@/lib/useColorScheme';
import Generic from './generic';
import Kind30402 from './kind30402';
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';

interface EventStickerViewProps {
    sticker: Sticker;
}

export default function EventStickerView({ sticker }: EventStickerViewProps) {
    const eventId = sticker.value;
    
    // Get the selected style or default to the first one if not set
    const selectedStyle = getStyleFromName(sticker.style);
    
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

    const content = (<>
        {!event ? (
            <ActivityIndicator size="small" color={colors.foreground} />
        ) : (
            <RenderEvent event={event} styles={selectedStyle} />
        )}
    </>)

    return (
        <View style={selectedStyle.container as ViewStyle}>
            {content}
        </View>
    );
}


function RenderEvent({ event, styles }: { event: NDKEvent, styles: EventStickerStyle }) {
    const { userProfile } = useUserProfile(event?.pubkey);
    
    switch (event.kind) {
        case NDKKind.Classified: return <Kind30402 event={event} userProfile={userProfile} styles={styles} />;
        default: return <Generic event={event} userProfile={userProfile} styles={styles} />
    }
}