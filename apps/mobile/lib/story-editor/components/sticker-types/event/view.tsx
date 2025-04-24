import {
    type NDKEvent,
    NDKKind,
    type NDKStoryStickerType,
    useSubscribe,
    useProfileValue,
} from '@nostr-dev-kit/ndk-mobile';
import React from 'react';
import { ActivityIndicator, type LayoutChangeEvent, View, type ViewStyle } from 'react-native';

import Generic from './generic';
import Kind20 from './kind20';
import Kind30023 from './kind30023';
import Kind30402 from './kind30402';
import KindVideo from './kind_video';
import { type EventStickerStyle, getStyleFromName } from './styles';

import type { Sticker } from '@/lib/story-editor/store/index';
import { useColorScheme } from '@/lib/useColorScheme';

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

    return (
        <View style={{ maxWidth }} onLayout={onLayout}>
            {!event ? (
                <View
                    style={[selectedStyle.container as ViewStyle, { maxWidth }]}
                    onLayout={onLayout}
                >
                    <ActivityIndicator size="small" color={colors.foreground} />
                </View>
            ) : (
                <RenderEvent event={event} styles={selectedStyle} />
            )}
        </View>
    );
}

function RenderEvent({ event, styles }: { event: NDKEvent; styles: EventStickerStyle }) {
    const userProfile = useProfileValue(event?.pubkey, { subOpts: { skipVerification: true } });

    // Convert NDKUserProfile to UserProfile if needed
    const profile = userProfile
        ? {
              pubkey: event.pubkey,
              ...userProfile,
          }
        : undefined;

    switch (event.kind) {
        case NDKKind.Classified:
            return <Kind30402 event={event} userProfile={profile} styles={styles} />;
        case (NDKKind as any).Article || ARTICLE_KIND:
            return <Kind30023 event={event} userProfile={profile} styles={styles} />;
        case NDKKind.Image:
            return <Kind20 event={event} userProfile={profile} styles={styles} />;
        case 22:
        case 21:
        case NDKKind.HorizontalVideo:
        case NDKKind.VerticalVideo:
            return <KindVideo event={event} userProfile={profile} styles={styles} />;
        default:
            return <Generic event={event} userProfile={profile} styles={styles} />;
    }
}
