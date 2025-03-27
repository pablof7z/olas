import type { TextStyle, ViewStyle } from 'react-native';

// Define PromptStickerStyle interface
export interface PromptStickerStyle {
    id?: string;
    name: string;
    container: ViewStyle & {
        iconSize?: number;
        showIcon?: boolean;
    };
    text: TextStyle;
    fontFamily?: string;
}

// Define 10 different styles for prompt stickers
const styles: PromptStickerStyle[] = [
    {
        id: 'default',
        name: 'Default',
        container: {
            backgroundColor: 'rgba(30, 144, 255, 0.5)',
            borderRadius: 16,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            iconSize: 18,
            showIcon: true,
        },
        text: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
        },
    },
    {
        id: 'modern',
        name: 'Modern',
        container: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 12,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            iconSize: 18,
            showIcon: true,
        },
        text: {
            color: '#333',
            fontSize: 16,
            fontWeight: 'normal',
        },
    },
    {
        id: 'terminal',
        name: 'Terminal',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 6,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            iconSize: 18,
            showIcon: true,
        },
        text: {
            color: '#0f0',
            fontSize: 14,
            fontWeight: '500',
        },
    },
    {
        id: 'glassmorphism',
        name: 'Glass',
        container: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 16,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#fff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            iconSize: 18,
            showIcon: true,
        },
        text: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
        },
    },
    {
        id: 'assistant',
        name: 'Assistant',
        container: {
            backgroundColor: 'rgba(103, 58, 183, 0.7)',
            borderRadius: 20,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            iconSize: 18,
            showIcon: true,
        },
        text: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
        },
    },
    {
        id: 'notecard',
        name: 'Notecard',
        container: {
            backgroundColor: 'rgba(255, 251, 235, 0.9)',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e0d8ba',
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            iconSize: 18,
            showIcon: true,
        },
        text: {
            color: '#5d4037',
            fontSize: 14,
            fontWeight: 'normal',
        },
    },
    {
        id: 'vibrant',
        name: 'Vibrant',
        container: {
            backgroundColor: 'rgba(233, 30, 99, 0.8)',
            borderRadius: 24,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            iconSize: 18,
            showIcon: true,
        },
        text: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
        },
    },
    {
        id: 'minimal',
        name: 'Minimal',
        container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: 8,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            iconSize: 18,
            showIcon: true,
        },
        text: {
            color: 'white',
            fontSize: 14,
            fontWeight: 'normal',
        },
    },
    {
        id: 'bot',
        name: 'Bot',
        container: {
            backgroundColor: 'rgba(33, 150, 243, 0.7)',
            borderRadius: 16,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            iconSize: 18,
            showIcon: true,
        },
        text: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
        },
    },
    {
        id: 'nostr',
        name: 'Nostr',
        container: {
            backgroundColor: 'rgba(128, 0, 128, 0.7)',
            borderRadius: 12,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            iconSize: 18,
            showIcon: true,
        },
        text: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
    },
];

export default styles;

// Helper function to get style by name
export function getStyleFromName(name?: string): PromptStickerStyle {
    if (!name) return styles[0];
    return styles.find((style) => style.name === name) || styles[0];
}

// Helper function to get the next style name
export function getNextStyleName(currentStyleName?: string): string {
    if (!currentStyleName) return styles[1].name;
    const index = styles.findIndex((style) => style.name === currentStyleName);
    return styles[index + 1]?.name || styles[0].name;
}
