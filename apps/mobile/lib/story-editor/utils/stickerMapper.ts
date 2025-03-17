import { NDKStorySticker, NDKUser, NDKStoryStickerType, NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { Sticker } from '../store';

/**
 * Maps our app's internal sticker representation to what NDK's addSticker expects
 *
 * @param sticker Our internal sticker representation
 * @param canvasSize Dimensions of the canvas for position normalization
 * @param stickerDimensions The actual dimensions of the sticker
 * @returns An object that can be passed to NDKStory.addSticker()
 */
export const mapStickerToNDKFormat = (
    sticker: Sticker, 
    stickerDimensions: { width: number; height: number }
): NDKStorySticker => {
    // Create the base sticker
    const baseSticker = {
        type: sticker.type,
        value: sticker.value,
        position: {
            x: Math.round(sticker.transform.translateX * 100) / 100,
            y: Math.round(sticker.transform.translateY * 100) / 100,
        },
        dimension: {
            width: Math.round(stickerDimensions.width),
            height: Math.round(stickerDimensions.height)
        },
        properties: {} as Record<string, string>,
    };

    // Add properties
    if (sticker.style) baseSticker.properties.style = sticker.style;
    if (sticker.transform.rotate) baseSticker.properties.rot = sticker.transform.rotate.toString();

    // Use type assertion to bypass the type checking
    return baseSticker as unknown as NDKStorySticker;
};
