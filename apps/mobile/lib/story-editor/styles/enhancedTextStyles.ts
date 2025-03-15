import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    useFonts,
    Inter_900Black,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
    Pacifico_400Regular,
} from '@expo-google-fonts/pacifico';
import {
    PermanentMarker_400Regular,
} from '@expo-google-fonts/permanent-marker';
import {
    DancingScript_700Bold,
} from '@expo-google-fonts/dancing-script';

export interface EnhancedTextStyle {
    id: string;
    name: string;
    style: {
        text: any;
        container: any;
        gradient?: {
            colors: [string, string] | [string, string, string];
            start?: { x: number; y: number };
            end?: { x: number; y: number };
        };
    };
    fontFamily?: string;
}

export const enhancedTextStyles: EnhancedTextStyle[] = [
    {
        id: 'neon-glow',
        name: 'Neon Glow',
        style: {
            text: {
                color: '#fff',
                fontSize: 40,
                fontWeight: 'bold',
                textShadowColor: '#00ff00',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
            },
            container: {
                padding: 15,
            },
            gradient: {
                colors: ['rgba(0, 255, 0, 0.2)', 'transparent'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }
        }
    },
    {
        id: 'sunset',
        name: 'Sunset',
        style: {
            text: {
                color: '#fff',
                fontSize: 36,
                fontWeight: 'bold',
            },
            container: {
                padding: 15,
                borderRadius: 10,
            },
            gradient: {
                colors: ['#FF512F', '#F09819'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
            }
        },
        fontFamily: 'PermanentMarker_400Regular'
    },
    {
        id: 'elegant',
        name: 'Elegant Script',
        style: {
            text: {
                color: '#fff',
                fontSize: 42,
            },
            container: {
                padding: 15,
            },
            gradient: {
                colors: ['rgba(255, 255, 255, 0.2)', 'transparent'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 0, y: 1 },
            }
        },
        fontFamily: 'DancingScript_700Bold'
    },
    {
        id: 'cyber',
        name: 'Cyberpunk',
        style: {
            text: {
                color: '#fff',
                fontSize: 38,
                letterSpacing: 2,
            },
            container: {
                padding: 15,
                borderWidth: 2,
                borderColor: '#0ff',
            },
            gradient: {
                colors: ['#0ff', '#83f'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }
        },
        fontFamily: 'Inter_900Black'
    },
    {
        id: 'retro',
        name: 'Retro',
        style: {
            text: {
                color: '#fff',
                fontSize: 36,
                letterSpacing: 1,
                textShadowColor: '#ff0080',
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 1,
            },
            container: {
                padding: 15,
                borderRadius: 5,
            },
            gradient: {
                colors: ['#ff0080', '#7928ca'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }
        },
        fontFamily: 'Pacifico_400Regular'
    }
];

export function getEnhancedStyleById(styleId: string): EnhancedTextStyle {
    return enhancedTextStyles.find(style => style.id === styleId) || enhancedTextStyles[0];
}

export function getNextEnhancedStyle(currentStyleId: string): EnhancedTextStyle {
    const currentIndex = enhancedTextStyles.findIndex(style => style.id === currentStyleId);
    const nextIndex = (currentIndex + 1) % enhancedTextStyles.length;
    return enhancedTextStyles[nextIndex];
} 