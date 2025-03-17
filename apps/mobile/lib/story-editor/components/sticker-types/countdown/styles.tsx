import { BaseStickerStyle } from '@/lib/story-editor/styles/stickerStyles';
import { registerStickerStyles } from '@/lib/story-editor/styles/stickerStyles';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';

// Define CountdownStickerStyle interface
export interface CountdownStickerStyle extends BaseStickerStyle {
    // Flat properties for backward compatibility
    backgroundColor?: string;
    backgroundOpacity?: number;
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    color?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fontStyle?: 'normal' | 'italic';
    textShadowColor?: string;
    textShadowOffset?: { width: number; height: number };
    textShadowRadius?: number;
    elevation?: number;
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
    iconColor?: string;
    
    // Nested structure
    container?: {
        backgroundColor?: string;
        backgroundOpacity?: number;
        borderWidth?: number;
        borderColor?: string;
        borderRadius?: number;
        borderStyle?: 'solid' | 'dashed' | 'dotted';
        padding?: number;
        elevation?: number;
        shadowColor?: string;
        shadowOffset?: { width: number; height: number };
        shadowOpacity?: number;
        shadowRadius?: number;
    };
    text?: {
        color?: string;
        fontSize?: number;
        fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
        fontStyle?: 'normal' | 'italic';
        textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
        textShadowColor?: string;
        textShadowOffset?: { width: number; height: number };
        textShadowRadius?: number;
    };
    countdown?: {
        color?: string;
        fontSize?: number;
        fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    };
    layout?: {
        direction: 'row' | 'column';
        iconSize?: number;
        showIcon?: boolean;
        alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
        justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
        gap?: number;
    };
    fontFamily?: string;
}

// Define 10 different styles for countdown stickers
const countdownStickerStyles: CountdownStickerStyle[] = [
    {
        id: 'default',
        name: 'Default',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 16,
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        iconColor: 'white',
    },
    {
        id: 'timer',
        name: 'Timer',
        backgroundColor: 'rgba(255, 59, 48, 0.8)',
        borderRadius: 20,
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        iconColor: 'white',
    },
    {
        id: 'elegant',
        name: 'Elegant',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        color: '#333',
        fontSize: 18,
        fontWeight: '500',
        iconColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    {
        id: 'digital',
        name: 'Digital',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 8,
        color: '#0f0',
        fontSize: 20,
        fontWeight: 'normal',
        iconColor: '#0f0',
    },
    {
        id: 'countdown',
        name: 'Countdown',
        backgroundColor: 'rgba(52, 152, 219, 0.7)',
        borderRadius: 16,
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        iconColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    {
        id: 'minimal',
        name: 'Minimal',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 8,
        color: 'white',
        fontSize: 18,
        fontWeight: 'normal',
        iconColor: 'white',
    },
    {
        id: 'event',
        name: 'Event',
        backgroundColor: 'rgba(156, 39, 176, 0.7)',
        borderRadius: 12,
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        iconColor: '#ffeb3b',
    },
    {
        id: 'rounded',
        name: 'Rounded',
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderRadius: 30,
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        iconColor: 'white',
    },
    {
        id: 'glass',
        name: 'Glass',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        iconColor: 'white',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    {
        id: 'dark',
        name: 'Dark',
        backgroundColor: 'rgba(33, 33, 33, 0.9)',
        borderRadius: 8,
        color: '#ff9800',
        fontSize: 18,
        fontWeight: 'bold',
        iconColor: '#ff9800',
    },
];

// Register the styles
registerStickerStyles(NDKStoryStickerType.Countdown, countdownStickerStyles);

export default countdownStickerStyles; 