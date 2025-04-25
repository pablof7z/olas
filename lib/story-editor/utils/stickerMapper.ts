import { NDKStorySticker } from '@nostr-dev-kit/ndk-mobile';

import type { Sticker } from '../store';

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
    const ndkSticker = new NDKStorySticker(sticker.type);
    ndkSticker.value = sticker.value;
    ndkSticker.position = {
        x: Math.round(sticker.transform.translateX * 100) / 100,
        y: Math.round(sticker.transform.translateY * 100) / 100,
    };
    ndkSticker.dimension = {
        width: Math.round(stickerDimensions.width),
        height: Math.round(stickerDimensions.height),
    };

    // Add properties
    if (sticker.style) ndkSticker.style = sticker.style;
    if (sticker.transform.rotate) ndkSticker.rotation = sticker.transform.rotate;

    // Use type assertion to bypass the type checking
    return ndkSticker as unknown as NDKStorySticker;
};
