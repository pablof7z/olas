import { BaseStickerStyle } from '@/lib/story-editor/styles/stickerStyles';
import { registerStickerStyles } from '@/lib/story-editor/styles/stickerStyles';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';

// Define EventStickerStyle interface
export interface EventStickerStyle extends BaseStickerStyle {
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
        backgroundGradient?: {
            colors: string[];
            start: { x: number; y: number };
            end: { x: number; y: number };
        };
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
    layout?: {
        direction: 'row' | 'column';
        avatarSize?: number;
        avatarPosition?: 'left' | 'top' | 'right';
        contentWidth?: number;
        gap?: number;
    };
    fontFamily?: string;
}

// Define 10 different styles for event stickers
const eventStickerStyles: EventStickerStyle[] = [
    {
        id: 'default',
        name: 'Default',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 16,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: 'white',
    },
    {
        id: 'card',
        name: 'Card',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: '#1e88e5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    {
        id: 'pill',
        name: 'Pill',
        backgroundColor: 'rgba(33, 150, 243, 0.8)',
        borderRadius: 30,
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        iconColor: 'white',
    },
    {
        id: 'ghost',
        name: 'Ghost',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        color: 'white',
        fontSize: 16,
        fontWeight: 'normal',
        iconColor: 'rgba(255, 255, 255, 0.9)',
    },
    {
        id: 'highlight',
        name: 'Highlight',
        backgroundColor: 'rgba(255, 235, 59, 0.9)',
        borderRadius: 4,
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: '#333',
    },
    {
        id: 'dark',
        name: 'Dark',
        backgroundColor: 'rgba(33, 33, 33, 0.9)',
        borderRadius: 8,
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: '#64b5f6',
    },
    {
        id: 'nostr',
        name: 'Nostr',
        backgroundColor: 'rgba(128, 0, 128, 0.7)',
        borderRadius: 12,
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: '#ffd700',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 4,
        color: 'white',
        fontSize: 14,
        fontWeight: 'normal',
        iconColor: 'white',
    },
    {
        id: 'rounded',
        name: 'Rounded',
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderRadius: 20,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    {
        id: 'outlined',
        name: 'Outlined',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#3f51b5',
        borderRadius: 8,
        color: '#3f51b5',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: '#3f51b5',
    },
];

// Register the styles
registerStickerStyles(NDKStoryStickerType.Event, eventStickerStyles);

export default eventStickerStyles; 