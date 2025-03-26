import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { BlurView } from 'expo-blur';
import { TextStyle, View, ViewStyle } from 'react-native';

interface GradientConfig {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
}

// Extend ViewStyle to include backgroundGradient
interface ExtendedViewStyle extends ViewStyle {
    backgroundGradient?: GradientConfig;
}

// Define the TextStickerStyle interface
export interface TextStickerStyle {
    name: string;
    container: ExtendedViewStyle | (() => React.ReactNode);
    text: TextStyle;
    fontFamily?: string;
}

const styles: TextStickerStyle[] = [
    {
        name: 'Basic',
        container: {
            backgroundColor: '#000000cc',
            paddingHorizontal: 24,
            paddingVertical: 10,
            borderRadius: 16,
        },
        text: {
            color: '#fff',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'Inter',
        },
    },
    {
        name: 'Glasss',
        container: () => (
            <BlurView style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 16 }} />
        ),
        text: {
            color: '#000',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'Pacifico', // Fun, handwritten font
        },
    },
    {
        name: 'Dark Glasss',
        container: () => (
            <BlurView tint="dark" style={{ flex: 1, borderWidth: 1, borderColor: '#00000099', borderRadius: 16, padding: 16 }} />
        ),
        text: {
            color: '#fff',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'Pacifico', // Fun, handwritten font
        },
    },
    {
        name: 'Candy Pop',
        container: {
            backgroundGradient: {
                colors: ['#ff4e50', '#ff9a9e'],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            },
            borderRadius: 32,
            padding: 16,
            borderWidth: 2,
            borderColor: '#ff9a9e',
            shadowColor: '#ff4e50',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 10,
        },
        text: {
            color: '#fff',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            letterSpacing: 2,
            fontFamily: 'Pacifico', // Fun, handwritten font
        },
    },
    {
        name: 'Cyberpunk',
        container: {
            backgroundGradient: {
                colors: ['#ff00ff', '#00ffff'],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            },
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: '#0ff',
        },
        text: {
            color: '#0ff',
            fontSize: 64,
            fontWeight: 'bold',
            textShadowColor: '#ff00ff',
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 10,
            textAlign: 'center',
            fontFamily: 'Orbitron', // Futuristic font
        },
    },
    {
        name: 'Soft Pastel',
        container: {
            backgroundColor: '#fdeff2',
            borderRadius: 12,
            padding: 16,
            borderWidth: 2,
            borderColor: '#ffb6c1',
        },
        text: {
            color: '#d47f7f',
            fontSize: 64,
            fontWeight: '500',
            textAlign: 'center',
            fontFamily: 'Dancing Script', // Elegant handwritten font
        },
    },
    {
        name: 'Comic Boom',
        container: {
            backgroundColor: '#ffeb3b',
            borderRadius: 16,
            padding: 12,
            borderWidth: 4,
            borderColor: '#000',
        },
        text: {
            color: '#ff0000',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            textShadowColor: '#000',
            textShadowOffset: { width: 4, height: 4 },
            textShadowRadius: 0,
            fontFamily: 'Bangers', // Bold, comic-style font
        },
    },
    {
        name: 'Retro Arcade',
        container: {
            backgroundColor: '#000',
            borderRadius: 8,
            padding: 12,
            borderWidth: 2,
            borderColor: '#ffcc00',
        },
        text: {
            color: '#ffcc00',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'Press Start 2P', // 8-bit arcade font
        },
    },
    {
        name: 'Neon Glow',
        container: {
            backgroundColor: '#111',
            borderRadius: 12,
            padding: 16,
        },
        text: {
            color: '#00ffcc',
            fontSize: 64,
            fontWeight: 'bold',
            textShadowColor: '#00ffcc',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 15,
            textAlign: 'center',
            fontFamily: 'Monoton', // Retro neon sign style
        },
    },
    {
        name: 'Graffiti Street',
        container: {
            backgroundGradient: {
                colors: ['#ff0000', '#ff8c00', '#ff00ff'],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            },
            borderRadius: 16,
            padding: 12,
            borderWidth: 2,
            borderColor: '#000',
        },
        text: {
            color: '#fff',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'Permanent Marker', // Street graffiti-style font
        },
    },
    {
        name: 'Luxury Gold',
        container: {
            backgroundGradient: {
                colors: ['#cfa75c', '#ffecb3'],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            },
            borderRadius: 10,
            padding: 14,
            borderWidth: 2,
            borderColor: '#8b6f47',
        },
        text: {
            color: '#704214',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'Cinzel', // Classic serif style
        },
    },
    {
        name: 'Bubble Gum',
        container: {
            backgroundGradient: {
                colors: ['#ff66b2', '#ff99cc'],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            },
            borderRadius: 24,
            padding: 12,
            shadowColor: '#ff3399',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
        },
        text: {
            color: '#fff',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'Lobster', // Curvy, fun font
        },
    },
    {
        name: 'Chalkboard',
        container: {
            backgroundColor: '#3e3e3e',
            borderRadius: 10,
            padding: 12,
            borderWidth: 2,
            borderColor: '#ffffff88',
        },
        text: {
            color: '#fff',
            fontSize: 64,
            fontWeight: '400',
            textAlign: 'center',
            fontFamily: 'Indie Flower', // Handwritten chalk style
        },
    },
    {
        name: 'Crystal Ice',
        container: {
            backgroundGradient: {
                colors: ['#d0f0ff', '#a0d8ff'],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            },
            borderRadius: 12,
            padding: 16,
        },
        text: {
            color: '#0066cc',
            fontSize: 64,
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'Fjalla One', // Clean, icy look
        },
    },
];

export function getStyleFromName(name?: string): TextStickerStyle {
    if (!name) return styles[0];
    return styles.find((style) => style.name === name) || styles[0];
}

export function getNextStyleName(currentStyleName?: string): string {
    if (!currentStyleName) return styles[0].name;
    const index = styles.findIndex((style) => style.name === currentStyleName);
    return styles[index + 1]?.name || styles[0].name;
}

export default styles;
