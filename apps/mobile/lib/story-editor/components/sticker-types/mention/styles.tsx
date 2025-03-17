import { TextStyle, ViewStyle } from 'react-native';
import { ImageStyle } from 'expo-image';
// Define MentionStickerStyle interface
export interface MentionStickerStyle {
    name: string;
    containerStyle: ViewStyle;
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
            padding: 48,
        },
        avatarStyle: {
            width: 256,
            height: 256,
            marginRight: 64,
        },
        nameStyle: {
            color: 'white',
            fontSize: 128,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Profile',
        containerStyle: {
            backgroundColor: 'rgba(33, 150, 243, 0.8)',
            borderRadius: 160,
            padding: 48,
        },
        avatarStyle: {
            width: 256,
            height: 256,
            marginRight: 64,
        },
        nameStyle: {
            color: 'white',
            fontSize: 128,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Card',
        containerStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 64,
            borderWidth: 8,
            borderColor: '#ddd',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
        },
        avatarStyle: {
            width: 512,
            height: 512,
            marginBottom: 64,
        },
        nameStyle: {
            color: '#333',
            fontSize: 128,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Tag',
        containerStyle: {
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderRadius: 240,
            padding: 48,
        },
        avatarStyle: false,
        nameStyle: {
            color: 'white',
            fontSize: 112,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Ghost',
        containerStyle: {
            backgroundColor: 'transparent',
            borderWidth: 8,
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 128,
            padding: 48,
        },
        avatarStyle: false,
        nameStyle: {
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 128,
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
    if (!currentStyleName) return styles[1].name;
    const index = styles.findIndex((style) => style.name === currentStyleName);
    return styles[index + 1]?.name || styles[0].name;
}
