// Define a basic style interface with just the essential fields
export interface BaseStickerStyle {
    id: string;
    name: string;
}

// Map of sticker type to its available styles
const stickerStylesMap: Record<string, Record<string, BaseStickerStyle>> = {};

/**
 * Get all styles for a specific sticker type
 * @param stickerType The type of sticker
 * @returns Array of styles for the sticker type
 */
export const getStickerStyles = (stickerType: string): BaseStickerStyle[] => {
    // If styles exist for this sticker type, return them
    if (stickerStylesMap[stickerType]) {
        return Object.values(stickerStylesMap[stickerType]);
    }
    
    // Default to empty array if no styles found
    return [];
};

/**
 * Register styles for a specific sticker type
 * @param stickerType The type of sticker
 * @param styles The styles to register
 */
export const registerStickerStyles = (stickerType: string, styles: BaseStickerStyle[]): void => {
    // Create an object map for faster lookups
    const stylesMap: Record<string, BaseStickerStyle> = {};
    styles.forEach(style => {
        stylesMap[style.id] = style;
    });
    
    stickerStylesMap[stickerType] = stylesMap;
};

/**
 * Get the next style for a sticker
 * @param stickerType The type of sticker
 * @param currentStyleId The current style id (can be undefined)
 * @returns The next style id
 */
export const getNextStyleId = (stickerType: string, currentStyleId?: string): string => {
    const styles = getStickerStyles(stickerType);
    
    // If no styles registered or empty array, return empty string
    if (!styles.length) {
        return '';
    }
    
    // If no current style, return the first style
    if (!currentStyleId) {
        return styles[0].id;
    }
    
    // Find the index of the current style
    const currentIndex = styles.findIndex(style => style.id === currentStyleId);
    
    // If not found or it's the last one, return the first style
    if (currentIndex === -1 || currentIndex === styles.length - 1) {
        return styles[0].id;
    }
    
    // Return the next style
    return styles[currentIndex + 1].id;
};

/**
 * Get a specific style by id
 * @param stickerType The type of sticker
 * @param styleId The style id
 * @returns The style object or undefined if not found
 */
export const getStickerStyle = (stickerType: string, styleId?: string): BaseStickerStyle | undefined => {
    if (!styleId || !stickerStylesMap[stickerType]) {
        return undefined;
    }
    
    return stickerStylesMap[stickerType][styleId];
}; 