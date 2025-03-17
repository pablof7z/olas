import { NDKStorySticker } from '@nostr-dev-kit/ndk-mobile';
import { Sticker } from '../store';

/**
 * Maps our app's internal sticker representation to what NDK's addSticker expects
 * 
 * @param sticker Our internal sticker representation
 * @param canvasSize Dimensions of the canvas for position normalization
 * @returns An object that can be passed to NDKStory.addSticker()
 */
export const mapStickerToNDKFormat = (
    sticker: Sticker, 
    canvasSize: { width: number, height: number }
) => {
    const ndkSticker: NDKStorySticker = {
        type: sticker.type,
        value: sticker.value,
        position: {
            x: sticker.transform.translateX / canvasSize.width,
            y: sticker.transform.translateY / canvasSize.height
        },
        dimension: {
            width: 100 * sticker.transform.scale / canvasSize.width,
            height: 50 * sticker.transform.scale / canvasSize.height
        }
    }

    ndkSticker.properties = {};

    if (sticker.style) ndkSticker.properties.style = sticker.style;
    if (sticker.transform.rotate) ndkSticker.properties.rot = sticker.transform.rotate.toString();

    return ndkSticker;
};

/**
 * Creates an index file to easily export all utility functions
 */
export * from './stickerMapper'; 