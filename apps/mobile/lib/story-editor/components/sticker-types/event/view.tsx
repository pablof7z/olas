import React from 'react';
import { View, ActivityIndicator, ViewStyle, LayoutChangeEvent } from 'react-native';
import { Sticker } from '@/lib/story-editor/store/index';
import { NDKKind, NDKStoryStickerType, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import { EventStickerStyle, getStyleFromName } from './styles';
import { NDKEvent, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { useColorScheme } from '@/lib/useColorScheme';
import Generic from './generic';
import Kind30402 from './kind30402';
import Kind30023 from './kind30023';

// Define NDKKind.Article if it doesn't exist
const ARTICLE_KIND = 30023;

interface EventStickerViewProps {
    sticker: Sticker<NDKStoryStickerType.Event>;
    onLayout?: (event: LayoutChangeEvent) => void;
    maxWidth?: number;
}

export default function EventStickerView({ sticker, onLayout, maxWidth }: EventStickerViewProps) {
    const event = sticker.value;

    // Get the selected style or default to the first one if not set
    const selectedStyle = getStyleFromName(sticker.style);

    const { colors } = useColorScheme();

    return <View style={[selectedStyle.container as ViewStyle, { maxWidth }]} onLayout={onLayout}>
        {!event ? (
            <ActivityIndicator size="small" color={colors.foreground} />
        ) : (
            <RenderEvent event={event} styles={selectedStyle} />
        )}
    </View>;
}

function RenderEvent({ event, styles }: { event: NDKEvent; styles: EventStickerStyle }) {
    const { userProfile } = useUserProfile(event?.pubkey);
    
    // Convert NDKUserProfile to UserProfile if needed
    const profile = userProfile ? {
        pubkey: event.pubkey,
        ...userProfile
    } : undefined;

    switch (event.kind) {
        case NDKKind.Classified:
            return <Kind30402 event={event} userProfile={profile} styles={styles} />;
        case (NDKKind as any).Article || ARTICLE_KIND:
            return <Kind30023 event={event} userProfile={profile} styles={styles} />;
        default:
            return <Generic event={event} userProfile={profile} styles={styles} />;
    }
}
