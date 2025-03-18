import { NDKStory, NDKStorySticker, NDKStoryStickerType, NDKEvent, NDKUser } from '@nostr-dev-kit/ndk-mobile';
import { v4 as uuidv4 } from 'uuid';

// Define the app's sticker format structure based on the one in store/index.ts
interface StickerDimensions {
    width: number;
    height: number;
}

interface StickerTransform {
    translateX: number;
    translateY: number;
    scale: number;
    rotate: number;
}

interface StickerMetadata {
    profile?: any;
    event?: NDKEvent;
    endTime?: Date;
    title?: string;
}

// Type mapping for sticker value types
type StickerValueType<T extends NDKStoryStickerType> = 
    T extends NDKStoryStickerType.Pubkey ? NDKUser :
    T extends NDKStoryStickerType.Text ? string :
    T extends NDKStoryStickerType.Countdown ? string :
    T extends NDKStoryStickerType.Event ? NDKEvent :
    string | NDKUser;

export interface Sticker<T extends NDKStoryStickerType = NDKStoryStickerType> {
    id: string;
    type: T;
    value: StickerValueType<T>;
    style?: string;
    transform: StickerTransform;
    dimensions: StickerDimensions;
    metadata?: StickerMetadata;
}

/**
 * Converts NDK Story stickers to the app's internal Sticker format
 * 
 * @param ndkStory The NDK Story event containing stickers
 * @returns Array of Stickers in the app's format
 */
export function mapNDKStickersToAppFormat(ndkStory: NDKStory): Sticker[] {
    if (!ndkStory || !ndkStory.stickers || ndkStory.stickers.length === 0) {
        return [];
    }

    return ndkStory.stickers.map((ndkSticker) => {
        // Parse dimensions from the dimension property
        let width = 100, height = 100;
        
        // Handle dimension parsing
        width = ndkSticker.dimension.width || 100;
        height = ndkSticker.dimension.height || 100;

        // Basic sticker structure
        const sticker: Sticker = {
            id: uuidv4(),
            type: ndkSticker.type as NDKStoryStickerType,
            value: ndkSticker.value as any, // Cast to any, then properly handle below
            style: ndkSticker.properties?.style,
            transform: {
                translateX: ndkSticker.position.x || 0,
                translateY: ndkSticker.position.y || 0,
                scale: 1, // Default scale
                rotate: ndkSticker.properties?.rot ? parseFloat(ndkSticker.properties.rot) : 0,
            },
            dimensions: {
                width,
                height
            }
        };

        // Additional processing based on sticker type
        switch (ndkSticker.type) {
            case NDKStoryStickerType.Countdown:
                // For countdown stickers, value should be a date string
                if (typeof ndkSticker.value === 'string') {
                    const endTimeStr = ndkSticker.properties?.endTime || ndkSticker.value;
                    const endTime = new Date(endTimeStr);
                    sticker.metadata = { endTime };
                    sticker.value = endTimeStr as any;
                }
                break;
                
            case NDKStoryStickerType.Event:
                // For event stickers, value should be an NDKEvent
                if (ndkSticker.value && typeof ndkSticker.value === 'object') {
                    const eventId = typeof ndkSticker.value === 'string' 
                        ? ndkSticker.value 
                        : (ndkSticker.value as any).id;
                    // Note: The actual NDKEvent object needs to be fetched/created separately
                    sticker.metadata = { 
                        event: ndkSticker.value as NDKEvent,
                        title: ndkSticker.properties?.title
                    };
                }
                break;
        }

        return sticker;
    });
}

/**
 * Extracts the dimensions of the canvas from an NDKStory event
 */
export function getCanvasDimensions(ndkStory: NDKStory): { width: number; height: number } {
    if (ndkStory.dimensions) return ndkStory.dimensions;

    // Look for canvas dimensions in event tags
    const canvasTag = ndkStory.tags.find(tag => tag[0] === 'canvas');
    if (canvasTag && canvasTag.length >= 3) {
        try {
            const width = parseInt(canvasTag[1], 10);
            const height = parseInt(canvasTag[2], 10);
            
            if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
                return { width, height };
            }
        } catch (e) {
            console.error('Error parsing canvas dimensions:', e);
        }
    }

    return { width: 1080, height: 1920 };
} 