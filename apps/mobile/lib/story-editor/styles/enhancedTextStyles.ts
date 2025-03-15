import { StyleSheet } from 'react-native';
import { 
    TextStickerStyle, 
    textStickerStyles, 
    getTextStickerStyleById as getTextStyle,
    getNextTextStickerStyle as getNextTextStyle
} from './textStickerStyles';

// Re-export for backward compatibility
export type EnhancedTextStyle = TextStickerStyle;
export const enhancedTextStyles = textStickerStyles;

export function getEnhancedStyleById(styleId: string): EnhancedTextStyle {
    return getTextStyle(styleId);
}

export function getNextEnhancedStyle(currentStyleId: string): EnhancedTextStyle {
    return getNextTextStyle(currentStyleId);
} 