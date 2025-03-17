import { LinearGradientProps } from 'expo-linear-gradient';
import { TextStyle, ViewStyle } from 'react-native';

// Define a custom container type that includes our layout props
type ContainerStyle = ViewStyle &
    Partial<LinearGradientProps> & {
        iconSize?: number;
        showIcon?: boolean;
    };

// Define CountdownStickerStyle interface
export interface CountdownStickerStyle {
    name: string;
    container: ContainerStyle;
    text: TextStyle;
    titleText: TextStyle;
    countdownText: TextStyle;
    fontFamily?: string;
}

// Define 10 different styles for countdown stickers
const styles: CountdownStickerStyle[] = [
    {
        name: 'Default',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 64,
            padding: 48,
            flexDirection: 'column',
            iconSize: 80,
            showIcon: true,
            alignItems: 'center',
            gap: 32,
        },
        text: {
            color: 'white',
            fontSize: 72,
            fontWeight: 'bold',
        },
        titleText: {
            color: 'white',
            fontSize: 90,
            fontWeight: 'bold',
        },
        countdownText: {
            color: 'white',
            fontSize: 64,
            fontWeight: 'normal',
        },
    },
    {
        name: 'Timer',
        container: {
            backgroundColor: 'rgba(255, 59, 48, 0.8)',
            borderRadius: 80,
            padding: 48,
            flexDirection: 'column',
            iconSize: 80,
            showIcon: true,
            alignItems: 'center',
            gap: 32,
        },
        text: {
            color: 'white',
            fontSize: 80,
            fontWeight: 'bold',
        },
        titleText: {
            color: 'white',
            fontSize: 64,
            fontWeight: 'normal',
        },
        countdownText: {
            color: 'white',
            fontSize: 88,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Elegant',
        container: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 48,
            padding: 48,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            flexDirection: 'column',
            iconSize: 72,
            showIcon: true,
            alignItems: 'center',
            gap: 32,
        },
        text: {
            color: '#333',
            fontSize: 72,
            fontWeight: '500',
        },
        titleText: {
            color: '#555',
            fontSize: 56,
            fontWeight: '400',
        },
        countdownText: {
            color: '#333',
            fontSize: 80,
            fontWeight: '600',
        },
    },
    {
        name: 'Digital',
        container: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: 32,
            padding: 48,
            flexDirection: 'column',
            iconSize: 80,
            showIcon: true,
            alignItems: 'center',
            gap: 32,
        },
        text: {
            color: '#0f0',
            fontSize: 80,
            fontWeight: 'normal',
        },
        titleText: {
            color: '#0ff',
            fontSize: 64,
            fontWeight: 'normal',
        },
        countdownText: {
            color: '#0f0',
            fontSize: 88,
            fontWeight: 'bold',
            fontFamily: 'monospace',
        },
    },
    {
        name: 'Countdown',
        container: {
            backgroundColor: 'rgba(52, 152, 219, 0.7)',
            borderRadius: 64,
            padding: 48,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            flexDirection: 'column',
            iconSize: 88,
            showIcon: true,
            alignItems: 'center',
            gap: 40,
        },
        text: {
            color: 'white',
            fontSize: 88,
            fontWeight: 'bold',
        },
        titleText: {
            color: 'white',
            fontSize: 72,
            fontWeight: '500',
        },
        countdownText: {
            color: 'white',
            fontSize: 96,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Minimal',
        container: {
            backgroundColor: 'transparent',
            borderWidth: 4,
            borderColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 32,
            padding: 48,
            flexDirection: 'column',
            iconSize: 72,
            showIcon: true,
            alignItems: 'center',
            gap: 32,
        },
        text: {
            color: 'white',
            fontSize: 72,
            fontWeight: 'normal',
        },
        titleText: {
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 56,
            fontWeight: 'normal',
        },
        countdownText: {
            color: 'white',
            fontSize: 72,
            fontWeight: '500',
        },
    },
    {
        name: 'Event',
        container: {
            backgroundColor: 'rgba(156, 39, 176, 0.7)',
            borderRadius: 48,
            padding: 48,
            flexDirection: 'column',
            iconSize: 80,
            showIcon: true,
            alignItems: 'center',
            gap: 32,
        },
        text: {
            color: 'white',
            fontSize: 72,
            fontWeight: 'bold',
        },
        titleText: {
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 64,
            fontWeight: '500',
            textTransform: 'uppercase',
        },
        countdownText: {
            color: 'white',
            fontSize: 80,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Rounded',
        container: {
            backgroundColor: 'rgba(76, 175, 80, 0.7)',
            borderRadius: 120,
            padding: 48,
            flexDirection: 'column',
            iconSize: 72,
            showIcon: true,
            alignItems: 'center',
            gap: 32,
        },
        text: {
            color: 'white',
            fontSize: 72,
            fontWeight: 'bold',
        },
        titleText: {
            color: 'white',
            fontSize: 56,
            fontWeight: 'normal',
        },
        countdownText: {
            color: 'white',
            fontSize: 72,
            fontWeight: 'bold',
        },
    },
    {
        name: 'Glass',
        container: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 64,
            padding: 48,
            shadowColor: '#fff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 40,
            flexDirection: 'column',
            iconSize: 80,
            showIcon: true,
            alignItems: 'center',
            gap: 32,
        },
        text: {
            color: 'white',
            fontSize: 80,
            fontWeight: 'bold',
        },
        titleText: {
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 64,
            fontWeight: 'normal',
        },
        countdownText: {
            color: 'white',
            fontSize: 88,
            fontWeight: 'bold',
            textShadowColor: 'rgba(0, 0, 0, 0.15)',
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 8,
        },
    },
    {
        name: 'Dark',
        container: {
            backgroundColor: 'rgba(33, 33, 33, 0.9)',
            borderRadius: 32,
            padding: 48,
            flexDirection: 'column',
            iconSize: 72,
            showIcon: true,
            alignItems: 'center',
            gap: 32,
        },
        text: {
            color: '#ff9800',
            fontSize: 72,
            fontWeight: 'bold',
        },
        titleText: {
            color: '#eeeeee',
            fontSize: 56,
            fontWeight: 'normal',
        },
        countdownText: {
            color: '#ff9800',
            fontSize: 80,
            fontWeight: 'bold',
        },
    },
];

export function getStyleFromName(name?: string): CountdownStickerStyle {
    if (!name) return styles[0];
    return styles.find((style) => style.name === name) || styles[0];
}

export function getNextStyleName(currentStyleName?: string): string {
    if (!currentStyleName) return styles[1].name;
    const index = styles.findIndex((style) => style.name === currentStyleName);
    return styles[index + 1]?.name || styles[0].name;
}

export default styles;
