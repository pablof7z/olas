import { LinearGradientProps } from "expo-linear-gradient";
import { TextStyle, ViewStyle } from "react-native";

// Define a custom container type that includes our layout props
type ContainerStyle = ViewStyle & Partial<LinearGradientProps> & {
    iconSize?: number;
    showIcon?: boolean;
};

// Define CountdownStickerStyle interface
export interface CountdownStickerStyle {
    name: string;
    container: ContainerStyle;
    text: TextStyle;
    fontFamily?: string;
}

// Define 10 different styles for countdown stickers
const styles: CountdownStickerStyle[] = [
    {
        name: 'Default',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 16,
            padding: 12,
            flexDirection: 'row',
            iconSize: 20,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        },
        text: {
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
        }
    },
    {
        name: 'Timer',
        container: {
            backgroundColor: 'rgba(255, 59, 48, 0.8)',
            borderRadius: 20,
            padding: 12,
            flexDirection: 'row',
            iconSize: 20,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        },
        text: {
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
        }
    },
    {
        name: 'Elegant',
        container: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 12,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            flexDirection: 'row',
            iconSize: 18,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        },
        text: {
            color: '#333',
            fontSize: 18,
            fontWeight: '500',
        }
    },
    {
        name: 'Digital',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            iconSize: 20,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        },
        text: {
            color: '#0f0',
            fontSize: 20,
            fontWeight: 'normal',
        }
    },
    {
        name: 'Countdown',
        container: {
            backgroundColor: 'rgba(52, 152, 219, 0.7)',
            borderRadius: 16,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 5,
            flexDirection: 'row',
            iconSize: 22,
            showIcon: true,
            alignItems: 'center',
            gap: 10
        },
        text: {
            color: 'white',
            fontSize: 22,
            fontWeight: 'bold',
        }
    },
    {
        name: 'Minimal',
        container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            iconSize: 18,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        },
        text: {
            color: 'white',
            fontSize: 18,
            fontWeight: 'normal',
        }
    },
    {
        name: 'Event',
        container: {
            backgroundColor: 'rgba(156, 39, 176, 0.7)',
            borderRadius: 12,
            padding: 12,
            flexDirection: 'row',
            iconSize: 20,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        },
        text: {
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
        }
    },
    {
        name: 'Rounded',
        container: {
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderRadius: 30,
            padding: 12,
            flexDirection: 'row',
            iconSize: 18,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        },
        text: {
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
        }
    },
    {
        name: 'Glass',
        container: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 16,
            padding: 12,
            shadowColor: '#fff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            flexDirection: 'row',
            iconSize: 20,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        },
        text: {
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
        }
    },
    {
        name: 'Dark',
        container: {
            backgroundColor: 'rgba(33, 33, 33, 0.9)',
            borderRadius: 8,
            padding: 12,
            flexDirection: 'row',
            iconSize: 18,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        },
        text: {
            color: '#ff9800',
            fontSize: 18,
            fontWeight: 'bold',
        }
    },
];

export function getStyleFromName(name?: string): CountdownStickerStyle {
    if (!name) return styles[0];
    return styles.find(style => style.name === name) || styles[0];
}

export function getNextStyleName(currentStyleName?: string): string {
    if (!currentStyleName) return styles[1].name;
    const index = styles.findIndex(style => style.name === currentStyleName);
    return styles[index + 1]?.name || styles[0].name;
}

export default styles; 