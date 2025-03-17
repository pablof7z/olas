import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { TextStyle, View, ViewStyle } from 'react-native';

interface SkiaConfig {
    colors: string[];
    type: 'text' | 'background';
    start: { x: number; y: number };
    end: { x: number; y: number };
    blur?: number;
}

// Define the TextStickerStyle interface
export interface TextStickerStyle {
    name: string;
    container: ViewStyle;
    text: TextStyle;
    useSkia?: boolean;
    skiaConfig?: SkiaConfig;
    fontFamily?: string;
}

// Define styles for text stickers with nested structure
const styles: TextStickerStyle[] = [
    {
        name: 'Default',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 16,
            padding: 12,
        },
        text: {
            color: 'white',
            fontSize: 128,
            fontWeight: 'bold',
            textAlign: 'center',
        },
    },
    {
        name: 'Neon',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 16,
            padding: 12,
        },
        text: {
            color: '#0ff',
            fontSize: 128,
            fontWeight: 'bold',
            textShadowColor: '#0ff',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10,
            textAlign: 'center',
        },
    },
    {
        name: 'Minimal',
        container: {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 8,
            padding: 12,
        },
        text: {
            color: '#000',
            fontSize: 128,
            fontWeight: 'normal',
            textAlign: 'center',
        },
    },
    {
        name: 'Retro',
        container: {
            backgroundColor: 'rgba(255, 220, 0, 0.8)',
            borderRadius: 8,
            borderWidth: 2,
            borderColor: '#000',
            padding: 12,
        },
        text: {
            color: '#000',
            fontSize: 128,
            fontWeight: 'bold',
            fontStyle: 'italic',
            textAlign: 'center',
        },
    },
    {
        name: 'Glitch',
        container: {
            backgroundColor: 'rgba(255, 0, 128, 0.7)',
            borderRadius: 8,
            padding: 12,
        },
        text: {
            color: '#fff',
            fontSize: 128,
            fontWeight: 'bold',
            textShadowColor: '#0ff',
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 0,
            textAlign: 'center',
        },
    },
    {
        name: 'Bubble',
        container: {
            backgroundColor: 'rgba(100, 200, 255, 0.8)',
            borderRadius: 24,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
        },
        text: {
            color: '#fff',
            fontSize: 128,
            fontWeight: 'bold',
            textAlign: 'center',
        },
    },
    {
        name: 'Outline',
        container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: '#fff',
            borderRadius: 16,
            padding: 12,
        },
        text: {
            color: '#fff',
            fontSize: 128,
            fontWeight: 'normal',
            textAlign: 'center',
        },
    },
    {
        name: 'Paper',
        container: {
            backgroundColor: 'rgba(255, 252, 235, 0.9)',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#d0c8b0',
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
        },
        text: {
            color: '#6d4c41',
            fontSize: 128,
            fontWeight: 'normal',
            textAlign: 'center',
        },
    },
    {
        name: 'Gradient BG',
        container: {
            backgroundGradient: {
                colors: ['rgba(120, 0, 255, 0.7)', 'rgba(60, 0, 128, 0.7)'],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            },
            borderRadius: 12,
            padding: 12,
        },
        text: {
            color: '#fff',
            fontSize: 128,
            fontWeight: 'bold',
            textAlign: 'center',
        },
    },
    {
        name: 'Typewriter',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 8,
            padding: 12,
        },
        text: {
            color: '#7FFF00',
            fontSize: 128,
            fontWeight: '400',
            textAlign: 'center',
        },
    },
    {
        name: 'Rainbow',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 12,
            padding: 12,
        },
        text: {
            fontSize: 128,
            fontWeight: 'bold',
            textAlign: 'center',
        },
        useSkia: true,
        skiaConfig: {
            colors: ['#FF0000', '#FFA500', '#FFFF00', '#008000', '#0000FF', '#4B0082', '#EE82EE'],
            type: 'text',
            start: { x: 0, y: 0 },
            end: { x: 1, y: 0 },
        },
    },
    {
        name: 'Neon Glow',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 12,
            padding: 12,
        },
        text: {
            fontSize: 128,
            fontWeight: 'bold',
            textAlign: 'center',
        },
        useSkia: true,
        skiaConfig: {
            colors: ['#00FFFF', '#FF00FF'],
            type: 'text',
            start: { x: 0, y: 0 },
            end: { x: 1, y: 1 },
            blur: 4,
        },
    },
    {
        name: 'Subtle BG',
        container: {
            backgroundGradient: {
                colors: ['rgba(240, 240, 240, 0.9)', 'rgba(220, 220, 220, 0.9)'],
                start: { x: 0, y: 0 },
                end: { x: 0, y: 1 },
            },
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
            borderColor: 'rgba(200, 200, 200, 0.5)',
        },
        text: {
            color: '#333',
            fontSize: 128,
            fontWeight: '500',
            textAlign: 'center',
        },
    },
    {
        name: 'Metallic',
        container: {
            backgroundColor: 'rgba(40, 40, 40, 0.85)',
            borderRadius: 12,
            padding: 12,
        },
        text: {
            fontSize: 128,
            fontWeight: 'bold',
            textAlign: 'center',
        },
        useSkia: true,
        skiaConfig: {
            colors: ['#C0C0C0', '#FFFFFF', '#A8A8A8', '#EFEFEF', '#8E8E8E'],
            type: 'text',
            start: { x: 0, y: 0 },
            end: { x: 0, y: 1 },
        },
    },
];

export function getStyleFromName(name?: string): TextStickerStyle {
    if (!name) return styles[0];
    return styles.find((style) => style.name === name) || styles[0];
}

export function getNextStyleName(currentStyleName?: string): string {
    if (!currentStyleName) return styles[1].name;
    const index = styles.findIndex((style) => style.name === currentStyleName);
    return styles[index + 1]?.name || styles[0].name;
}

export default styles;
