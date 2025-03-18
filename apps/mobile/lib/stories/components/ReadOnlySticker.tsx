import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Sticker } from '../utils';
import { NDKStoryStickerType, useNDK, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import {
    TextStickerView,
    EventStickerView,
    CountdownStickerView,
    MentionStickerView,
} from '@/lib/story-editor/components/sticker-types';

interface ReadOnlyStickerProps {
    sticker: Sticker;
    containerDimensions: { width: number; height: number };
    originalDimensions: { width: number; height: number };
}

/**
 * A read-only component to render stickers in story view mode
 */
export default function ReadOnlySticker({ 
    sticker, 
    containerDimensions, 
    originalDimensions 
}: ReadOnlyStickerProps) {
    // Calculate position and scale factors
    const scaleFactorX = containerDimensions.width / originalDimensions.width;
    const scaleFactorY = containerDimensions.height / originalDimensions.height;

    console.log('scaleFactor', { scaleFactorX, scaleFactorY, containerDimensions, originalDimensions });
    
    // Position and size
    const left = sticker.transform.translateX * scaleFactorX;
    const top = sticker.transform.translateY * scaleFactorY;
    const width = sticker.dimensions.width * scaleFactorX;
    const height = sticker.dimensions.height * scaleFactorY;

    const isTextSticker = sticker.type === NDKStoryStickerType.Text;
    const isMentionSticker = sticker.type === NDKStoryStickerType.Pubkey;
    const isCountdownSticker = sticker.type === NDKStoryStickerType.Countdown;
    
    // Render content based on sticker type
    const renderContent = () => {
        console.log('Will render sticker of type', sticker.type, { left, top, width, height });
        
        switch (sticker.type) {
            case NDKStoryStickerType.Text:
                return <TextStickerView sticker={sticker as Sticker<NDKStoryStickerType.Text>} fixedDimensions={true} />;
            case NDKStoryStickerType.Pubkey:
                return <MentionStickerView sticker={sticker as Sticker<NDKStoryStickerType.Pubkey>} />;
            // case NDKStoryStickerType.Event:
                // return <EventStickerView sticker={sticker as Sticker<NDKStoryStickerType.Event>} />;
            case NDKStoryStickerType.Countdown:
                return <CountdownStickerView sticker={sticker as any} />;
            default:
                return null;
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height,
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    transform: [
                        { rotate: `${sticker.transform.rotate}deg` },
                        { scale: 1 }
                    ]
                }
            ]}
        >
            {isTextSticker && <TextSticker sticker={sticker as Sticker<NDKStoryStickerType.Text>} />}
            {isMentionSticker && <MentionSticker sticker={sticker as Sticker<NDKStoryStickerType.Pubkey>} />}
            {isCountdownSticker && <CountdownSticker sticker={sticker as Sticker<NDKStoryStickerType.Countdown>} />}
        </View>
    );
}

function TextSticker({ sticker }: { sticker: Sticker<NDKStoryStickerType.Text> }) {
    return <TextStickerView sticker={sticker as Sticker<NDKStoryStickerType.Text>} fixedDimensions={true} />;
}

function MentionSticker({ sticker }: { sticker: Sticker }) {
    const { ndk } = useNDK();
    const user = useMemo(() => ndk.getUser({pubkey: sticker.value as string}), [ndk, sticker.value]);
    const { userProfile } = useUserProfile(user.pubkey);

    const pubkeySticker = useMemo<Sticker<NDKStoryStickerType.Pubkey>>(() => ({
        ...sticker,
        value: user,
        metadata: { profile: userProfile },
    } as Sticker<NDKStoryStickerType.Pubkey>), [sticker, user, userProfile]);

    return <MentionStickerView sticker={pubkeySticker} fixedDimensions={true} />;
}

function CountdownSticker({ sticker }: { sticker: Sticker<NDKStoryStickerType.Countdown> }) {
    return <CountdownStickerView sticker={sticker as any} />;
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    }
}); 