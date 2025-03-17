import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Sticker } from '../utils';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
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
    
    // Render content based on sticker type
    const renderContent = () => {
        if (sticker.type !== NDKStoryStickerType.Text) return null;
        
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
                    borderWidth: 1,
                    borderColor: 'yellow',
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
            {renderContent()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    }
}); 