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
const mentionStickerStyles: MentionStickerStyle[] = [
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

export default mentionStickerStyles; 

export function getNextStyleName(currentStyle: string | undefined) {
    if (!currentStyle) return mentionStickerStyles[0].name;
    
    const currentIndex = mentionStickerStyles.findIndex(style => style.name === currentStyle);
    const nextIndex = (currentIndex + 1) % mentionStickerStyles.length;
    return mentionStickerStyles[nextIndex].name;
}

export function getNextStyle(currentStyle: string | undefined) {
    if (!currentStyle) return mentionStickerStyles[0];
    
    const currentIndex = mentionStickerStyles.findIndex(style => style.name === currentStyle);
    const nextIndex = (currentIndex + 1) % mentionStickerStyles.length;
    return mentionStickerStyles[nextIndex];
}