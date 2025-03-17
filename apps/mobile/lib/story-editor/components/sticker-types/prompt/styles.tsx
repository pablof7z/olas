import { BaseStickerStyle } from '@/lib/story-editor/styles/stickerStyles';
import { registerStickerStyles } from '@/lib/story-editor/styles/stickerStyles';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';

// Define PromptStickerStyle interface
export interface PromptStickerStyle extends BaseStickerStyle {
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
    style?: {
        text: any;
        container: any;
        input: any;
        button: any;
        gradient?: {
            colors: [string, string] | [string, string, string];
            start?: { x: number; y: number };
            end?: { x: number; y: number };
        };
    };
    fontFamily?: string;
}

// Define 10 different styles for prompt stickers
const promptStickerStyles: PromptStickerStyle[] = [
    {
        id: 'default',
        name: 'Default',
        backgroundColor: 'rgba(30, 144, 255, 0.5)',
        borderRadius: 16,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: 'white',
    },
    {
        id: 'modern',
        name: 'Modern',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        color: '#333',
        fontSize: 16,
        fontWeight: 'normal',
        iconColor: '#1e88e5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    {
        id: 'terminal',
        name: 'Terminal',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 6,
        color: '#0f0',
        fontSize: 14,
        fontWeight: '500',
        iconColor: '#0f0',
    },
    {
        id: 'glassmorphism',
        name: 'Glass',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: 'white',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    {
        id: 'assistant',
        name: 'Assistant',
        backgroundColor: 'rgba(103, 58, 183, 0.7)',
        borderRadius: 20,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: '#ffeb3b',
    },
    {
        id: 'notecard',
        name: 'Notecard',
        backgroundColor: 'rgba(255, 251, 235, 0.9)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0d8ba',
        color: '#5d4037',
        fontSize: 14,
        fontWeight: 'normal',
        iconColor: '#5d4037',
    },
    {
        id: 'vibrant',
        name: 'Vibrant',
        backgroundColor: 'rgba(233, 30, 99, 0.8)',
        borderRadius: 24,
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
        id: 'minimal',
        name: 'Minimal',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 8,
        color: 'white',
        fontSize: 14,
        fontWeight: 'normal',
        iconColor: 'white',
    },
    {
        id: 'bot',
        name: 'Bot',
        backgroundColor: 'rgba(33, 150, 243, 0.7)',
        borderRadius: 16,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: 'white',
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
];

// Register the styles
registerStickerStyles(NDKStoryStickerType.Prompt, promptStickerStyles);

export default promptStickerStyles; 