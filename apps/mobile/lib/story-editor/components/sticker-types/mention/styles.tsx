import type { ImageStyle } from 'expo-image';
import type { TextStyle, ViewStyle } from 'react-native';

// Extended ViewStyle with backgroundGradient property
export interface ExtendedViewStyle extends ViewStyle {
    backgroundGradient?: {
        colors: readonly [string, string, ...string[]]; // Typed as required by LinearGradient
        start?: { x: number; y: number };
        end?: { x: number; y: number };
    };
}

// Define MentionStickerStyle interface
export interface MentionStickerStyle {
    name: string;
    containerStyle: ViewStyle | ExtendedViewStyle;
    avatarStyle: ImageStyle | false;
    nameStyle: TextStyle | false;
}

// Define 10 different styles for mention stickers
const styles: MentionStickerStyle[] = [
    {
        name: 'Default',
        containerStyle: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            flexDirection: 'row',
            alignItems: 'center',
            padding: 20,
            borderRadius: 8,
        },
        avatarStyle: {
            width: 48,
            height: 48,
        },
        nameStyle: {
            marginLeft: 24,
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Profile',
        containerStyle: {
            backgroundColor: 'rgba(33, 150, 243, 0.8)',
            borderRadius: 160,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
        },
        avatarStyle: {
            width: 48,
            height: 48,
        },
        nameStyle: {
            marginLeft: 24,
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Card',
        containerStyle: {
            backgroundGradient: {
                colors: ['#4c669f', '#3b5998', '#192f6a'] as const,
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            },
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: '#ddd',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
        },
        avatarStyle: {
            width: 64,
            height: 64,
            marginBottom: 4,
            borderRadius: 8,
        },
        nameStyle: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Tag',
        containerStyle: {
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderRadius: 240,
            padding: 20,
        },
        avatarStyle: false,
        nameStyle: {
            color: 'white',
            fontSize: 48,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Ghost',
        containerStyle: {
            backgroundGradient: {
                colors: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.4)'] as const,
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            },
            borderWidth: 8,
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 8,
            padding: 20,
        },
        avatarStyle: false,
        nameStyle: {
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 48,
            fontWeight: 'normal',
        },
    },
];

export default styles;

export function getStyleFromName(name?: string): MentionStickerStyle {
    if (!name) return styles[0];
    return styles.find((style) => style.name === name) || styles[0];
}

export function getNextStyleName(currentStyleName?: string): string {
    if (!currentStyleName) return styles[0].name;
    const index = styles.findIndex((style) => style.name === currentStyleName);
    return styles[index + 1]?.name || styles[0].name;
}
