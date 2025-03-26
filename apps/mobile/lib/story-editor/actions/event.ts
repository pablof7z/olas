import NDK, { NDKImetaTag, NDKStory, NDKStoryDimension } from '@nostr-dev-kit/ndk-mobile';
import { getVideoMetaData } from 'react-native-compressor';
import { Sticker } from '../store';
import { mapStickerToNDKFormat } from '../utils/stickerMapper';
import { toast } from '@backpackapp-io/react-native-toast';
import { Dimensions } from 'react-native';

interface CreateStoryEventParams {
    ndk: NDK;
    imeta: NDKImetaTag;
    path: string;
    type: 'photo' | 'video';
    stickers: Sticker[];
    dimensions: NDKStoryDimension;
    publish?: boolean;
    duration?: number; // Duration in seconds, defaults to 24 hours
}

/**
 * Creates and publishes a story event with the given media and stickers
 */
export const createStoryEvent = async (params: CreateStoryEventParams): Promise<NDKStory> => {
    const { ndk, imeta, path, type, dimensions, stickers, duration = 24 * 60 * 60 } = params;

    // Create a new story event
    const event = new NDKStory(ndk);

    // Add video duration if it's a video
    if (type === 'video') {
        try {
            const metadata = await getVideoMetaData(path);
            if (metadata && metadata.duration) {
                event.duration = metadata.duration;
            }
        } catch (err) {
            console.error('Error getting video metadata:', err);
        }
    }

    console.log('Setting story event properties');
    event.imeta = imeta;
    event.alt = `This is a story event created with Olas`;

    // Set expiration time (current timestamp + duration in seconds)
    const now = Math.floor(Date.now() / 1000);
    event.tags.push(['expiration', (now + duration).toString()]);

    event.dimensions = dimensions;

    console.log('Adding stickers to event:', stickers.length);
    // Add stickers to the event
    for (const sticker of stickers) {
        try {
            // Use the utility function to map our sticker to NDK format
            const dimensions = sticker.dimensions;
            const ndkSticker = mapStickerToNDKFormat(sticker, dimensions || { width: 0, height: 0 });
            event.addSticker(ndkSticker);
        } catch (error: any) {
            console.trace('Error adding sticker: ' + error?.message);
            toast.error('Error adding sticker: ' + error?.message);
            // Continue with other stickers instead of returning null
        }
    }

    // Sign the story event
    await event.sign();
    return event;
};
