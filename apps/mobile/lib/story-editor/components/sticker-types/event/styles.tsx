import { ImageStyle, TextStyle, ViewStyle } from 'react-native';

export interface EventStickerStyle {
    name: string;
    container: ViewStyle;
    text: TextStyle;
    icon?: {
        color: string;
    };
    // author style, if false we don't show the author
    author:
        | false
        | {
              // avatar style, if false we don't show the avatar
              avatarStyle: ImageStyle | false;
              // name style, if false we don't show the name
              nameStyle: TextStyle | false;
          };
}

// Define 10 different styles for event stickers
const styles: EventStickerStyle[] = [
    {
        name: 'Default',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 8,
            padding: 10,
        },
        text: {
            color: 'white',
            fontSize: 18,
            fontWeight: 'normal',
        },
        icon: {
            color: 'white',
        },
        author: {
            avatarStyle: {
                width: 48,
                height: 48,
                borderRadius: 48,
                marginRight: 8,
            },
            nameStyle: {
                color: 'white',
                fontSize: 18,
                fontWeight: 'bold',
            },
        },
    },
    {
        name: 'Card',
        container: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 16,
            borderWidth: 2,
            borderColor: '#ddd',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            padding: 10,
        },
        text: {
            color: '#333',
            fontSize: 24,
            fontWeight: 'bold',
        },
        icon: {
            color: '#1e88e5',
        },
        author: {
            avatarStyle: {
                width: 48,
                height: 48,
                borderRadius: 18,
                marginRight: 16,
            },
            nameStyle: {
                color: '#555',
                fontSize: 28,
            },
        },
    },
    {
        name: 'Pill',
        container: {
            backgroundColor: 'rgba(33, 150, 243, 0.8)',
            borderRadius: 60,
            padding: 16,
        },
        text: {
            color: 'white',
            fontSize: 28,
            fontWeight: 'bold',
        },
        icon: {
            color: 'white',
        },
        author: false,
    },
    {
        name: 'Ghost',
        container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 16,
            padding: 10,
        },
        text: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'normal',
        },
        icon: {
            color: 'rgba(255, 255, 255, 0.9)',
        },
        author: {
            avatarStyle: {
                width: 48,
                height: 48,
                borderRadius: 24,
                marginRight: 8,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.7)',
            },
            nameStyle: {
                color: 'white',
                fontSize: 14,
                opacity: 0.9,
            },
        },
    },
    {
        name: 'Highlight',
        container: {
            backgroundColor: 'rgba(255, 235, 59, 0.9)',
            borderRadius: 4,
            padding: 8,
        },
        text: {
            color: '#333',
            fontSize: 16,
            fontWeight: 'bold',
        },
        icon: {
            color: '#333',
        },
        author: {
            avatarStyle: {
                width: 18,
                height: 18,
                borderRadius: 12,
                marginRight: 8,
            },
            nameStyle: {
                color: '#555',
                fontSize: 14,
                fontWeight: 'bold',
            },
        },
    },
    {
        name: 'Dark',
        container: {
            backgroundColor: 'rgba(33, 33, 33, 0.9)',
            borderRadius: 8,
            padding: 12,
        },
        text: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        icon: {
            color: '#64b5f6',
        },
        author: {
            avatarStyle: {
                width: 18,
                height: 18,
                borderRadius: 12,
                marginRight: 8,
            },
            nameStyle: {
                color: '#64b5f6',
                fontSize: 14,
            },
        },
    },
    {
        name: 'Nostr',
        container: {
            backgroundColor: 'rgba(128, 0, 128, 0.7)',
            borderRadius: 12,
            padding: 12,
        },
        text: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
        icon: {
            color: '#ffd700',
        },
        author: {
            avatarStyle: {
                width: 18,
                height: 18,
                borderRadius: 12,
                marginRight: 8,
                borderWidth: 1,
                borderColor: '#ffd700',
            },
            nameStyle: {
                color: '#ffd700',
                fontSize: 14,
            },
        },
    },
    {
        name: 'Minimal',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 4,
            padding: 6,
        },
        text: {
            color: 'white',
            fontSize: 14,
            fontWeight: 'normal',
        },
        icon: {
            color: 'white',
        },
        author: false,
    },
    {
        name: 'Rounded',
        container: {
            backgroundColor: 'rgba(76, 175, 80, 0.8)',
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            padding: 12,
        },
        text: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
        },
        icon: {
            color: 'white',
        },
        author: {
            avatarStyle: {
                width: 18,
                height: 18,
                borderRadius: 12,
                marginRight: 8,
            },
            nameStyle: {
                color: 'white',
                fontSize: 14,
            },
        },
    },
    {
        name: 'Outlined',
        container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: '#3f51b5',
            borderRadius: 8,
            padding: 10,
        },
        text: {
            color: '#3f51b5',
            fontSize: 16,
            fontWeight: 'bold',
        },
        icon: {
            color: '#3f51b5',
        },
        author: {
            avatarStyle: false,
            nameStyle: {
                color: '#3f51b5',
                fontWeight: 'bold',
            },
        },
    },
];

export function getStyleFromName(name?: string): EventStickerStyle {
    if (!name) return styles[0];
    return styles.find((style) => style.name === name) || styles[0];
}

export function getNextStyleName(currentStyleName?: string): string {
    if (!currentStyleName) return styles[0].name;
    const index = styles.findIndex((style) => style.name === currentStyleName);
    return styles[index + 1]?.name || styles[0].name;
}
