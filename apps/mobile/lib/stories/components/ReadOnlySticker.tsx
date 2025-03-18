import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, LayoutChangeEvent, Button } from 'react-native';
import { Sticker } from '../utils';
import { NDKStoryStickerType, useNDK, useUserProfile, NDKEvent } from '@nostr-dev-kit/ndk-mobile';
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

const maxWidth = Dimensions.get('window').width * 0.9;

/**
 * A read-only component to render stickers in story view mode
 */
export default function ReadOnlySticker({ 
    sticker, 
    containerDimensions, 
    originalDimensions 
}: ReadOnlyStickerProps) {
    const [scale, setScale] = useState(1);
    
    // Calculate position and scale factors
    const scaleFactorX = containerDimensions.width / originalDimensions.width;
    const scaleFactorY = containerDimensions.height / originalDimensions.height;

    // Position and size
    const left = sticker.transform.translateX * scaleFactorX;
    const top = sticker.transform.translateY * scaleFactorY;
    const width = sticker.dimensions.width * scaleFactorX;
    const height = sticker.dimensions.height * scaleFactorY;

    const isTextSticker = sticker.type === NDKStoryStickerType.Text;
    const isMentionSticker = sticker.type === NDKStoryStickerType.Pubkey;
    const isCountdownSticker = sticker.type === NDKStoryStickerType.Countdown;
    const isEventSticker = sticker.type === NDKStoryStickerType.Event;

    const pendingScale = useRef(1);

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width: renderedWidth, height: renderedHeight } = event.nativeEvent.layout;
        console.log('👋 parent handleLayout');
        
        if (renderedWidth === 0 || renderedHeight === 0) {
            console.warn('Layout dimensions are 0, skipping');
            return;
        }
        
        // Calculate scale factor to maintain aspect ratio
        const originalAspectRatio = sticker.dimensions.width / sticker.dimensions.height;
        const renderedAspectRatio = renderedWidth / renderedHeight;
        
        let newScale = 1;
        
        // Determine if we need to scale based on width or height to maintain aspect ratio
        if (originalAspectRatio > renderedAspectRatio) {
            // Width is the limiting factor
            newScale = width / renderedWidth;
            console.log('👋 parent handleLayout will change scale by using width', { newScale, width, renderedWidth });
        } else {
            // Height is the limiting factor
            newScale = height / renderedHeight;
            console.log('👋 parent handleLayout will change scale by using heighto', { newScale, height, renderedHeight });
        }

        pendingScale.current = newScale;

        console.log('👋 parent handleLayout will change scale to', { newScale });
        
        // setScale(newScale);
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
                    maxWidth,
                    height,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center', borderWidth: 1, borderColor: 'blue',
                    transform: [
                        { rotate: `${sticker.transform.rotate}deg` }
                    ]
                }
            ]}
        >
            <View style={{ transform: [{ scale }], borderWidth: 1, borderColor: 'cyan' }}>
                <View style={{ borderWidth: 1, borderColor: 'cyan' }}>
                    {isTextSticker && <TextSticker sticker={sticker as Sticker<NDKStoryStickerType.Text>} onLayout={handleLayout} />}
                    {isMentionSticker && <MentionSticker sticker={sticker as Sticker<NDKStoryStickerType.Pubkey>} onLayout={handleLayout} />}
                    {isCountdownSticker && <CountdownSticker sticker={sticker as Sticker<NDKStoryStickerType.Countdown>} onLayout={handleLayout} />}
                    {isEventSticker && <EventSticker sticker={sticker as Sticker<NDKStoryStickerType.Event>} onLayout={handleLayout} />}
                </View>
            </View>
        </View>
    );
}

function TextSticker({ sticker, onLayout }: { sticker: Sticker<NDKStoryStickerType.Text>; onLayout?: (event: LayoutChangeEvent) => void }) {
    return <TextStickerView
        sticker={sticker as Sticker<NDKStoryStickerType.Text>} fixedDimensions={true} onLayout={onLayout} />;
}

function MentionSticker({ sticker, onLayout }: { sticker: Sticker; onLayout?: (event: LayoutChangeEvent) => void }) {
    const { ndk } = useNDK();
    const user = useMemo(() => ndk.getUser({pubkey: sticker.value as string}), [ndk, sticker.value]);
    const { userProfile } = useUserProfile(user.pubkey);

    const pubkeySticker = useMemo<Sticker<NDKStoryStickerType.Pubkey>>(() => ({
        ...sticker,
        value: user,
        metadata: { profile: userProfile },
    } as Sticker<NDKStoryStickerType.Pubkey>), [sticker, user, userProfile]);

    return <MentionStickerView sticker={pubkeySticker} onLayout={onLayout} />;
}

function CountdownSticker({ sticker, onLayout }: { sticker: Sticker<NDKStoryStickerType.Countdown>; onLayout?: (event: LayoutChangeEvent) => void }) {
    return <CountdownStickerView sticker={sticker as any} onLayout={onLayout} />;
}

function EventSticker({ sticker, onLayout }: { sticker: Sticker<NDKStoryStickerType.Event>; onLayout?: (event: LayoutChangeEvent) => void }) {
    const { ndk } = useNDK();
    const [ event, setEvent ] = useState<NDKEvent | null>(null);

    useEffect(() => {
        console.log('👋 fetching event', sticker.value);
        ndk.fetchEvent(sticker.value as unknown as string).then((event) => {
            console.log('👋 event', event);
            if (event) setEvent(event);
        });
    }, [sticker.value])

    if (!event) return null;

    return <EventStickerView sticker={{ ...sticker, value: event }} onLayout={onLayout} />;
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    }
}); 