import NDK, { NDKImetaTag, NDKStory } from '@nostr-dev-kit/ndk-mobile';
import { getVideoMetaData } from 'react-native-compressor';
import { Sticker } from '../store';
import { mapStickerToNDKFormat } from '../utils';
import { debugEvent } from '@/utils/debug';
import { toast } from '@backpackapp-io/react-native-toast';
import { Dimensions } from 'react-native';

interface CreateStoryEventParams {
    ndk: NDK;
    imeta: NDKImetaTag;
    path: string;
    type: 'photo' | 'video';
    stickers: Sticker[];
    canvasSize: { width: number; height: number };
}

/**
 * Creates and publishes a story event with the given media and stickers
 */
export const createAndPublishStoryEvent = async (params: CreateStoryEventParams): Promise<NDKStory | null> => {
    const { ndk, imeta, path, type, stickers, canvasSize } = params;

    // Create a new story event
    const event = new NDKStory(ndk);
    
    // Add video duration if it's a video
    if (type === 'video') {
        const metadata = await getVideoMetaData(path);
        if (metadata && metadata.duration) {
            event.duration = metadata.duration;
        }
    }

    event.imetas = [imeta];
    event.alt = `This is a story event created with Olas`;

    const dimensions = Dimensions.get('window');
    event.dimensions = dimensions;

    // Add stickers to the event
    for (const sticker of stickers) {
        try {   
            // Use the utility function to map our sticker to NDK format
            const dimensions = sticker.dimensions;
            const ndkSticker = mapStickerToNDKFormat(sticker, dimensions);
            event.addSticker(ndkSticker);
        } catch (error: any) {
            console.trace('Error adding sticker: ' + error?.message);
            toast.error('Error adding sticker: ' + error?.message);
            return null;
        }
    }

    // Publish the story event
    await event.sign();
    debugEvent(event);
    await event.publish();
    
    return event;
};
