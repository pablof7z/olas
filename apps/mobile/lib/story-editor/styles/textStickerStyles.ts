import { StyleSheet } from 'react-native';

export interface TextStickerStyle {
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

export const textStickerStyles: TextStickerStyle[] = [
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
                borderWidth: 0,
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
                borderWidth: 0,
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
                borderWidth: 0,
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
                borderWidth: 0,
            },
            gradient: {
                colors: ['#ff0080', '#7928ca'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }
        },
        fontFamily: 'Pacifico_400Regular'
    },
    {
        id: 'vaporwave',
        name: 'Vaporwave',
        style: {
            text: {
                color: '#fff',
                fontSize: 38,
                letterSpacing: 3,
                textShadowColor: '#ff00ff',
                textShadowOffset: { width: 3, height: 3 },
                textShadowRadius: 0,
            },
            container: {
                padding: 15,
                borderWidth: 4,
                borderColor: '#00ffff',
                borderStyle: 'solid',
                borderRadius: 0,
            },
            gradient: {
                colors: ['#ff00ff', '#00ffff'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }
        },
        fontFamily: 'Anton_400Regular'
    },
    {
        id: 'watercolor',
        name: 'Watercolor',
        style: {
            text: {
                color: '#fff',
                fontSize: 40,
                textShadowColor: 'rgba(0,0,0,0.2)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
            },
            container: {
                padding: 15,
                borderWidth: 0,
            },
            gradient: {
                colors: ['#91EAE4', '#86A8E7', '#7F7FD5'] as [string, string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }
        },
        fontFamily: 'DancingScript_700Bold'
    },
    {
        id: 'paper-cut',
        name: 'Paper Cut',
        style: {
            text: {
                color: '#444',
                fontSize: 42,
                textShadowColor: 'rgba(255,255,255,0.8)',
                textShadowOffset: { width: -1, height: -1 },
                textShadowRadius: 1,
            },
            container: {
                padding: 15,
                borderRadius: 8,
                backgroundColor: '#f5f5f5',
                borderWidth: 0,
                shadowColor: '#000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
            }
        },
        fontFamily: 'Caveat_700Bold'
    },
    {
        id: 'metallic',
        name: 'Metallic',
        style: {
            text: {
                color: '#fff',
                fontSize: 38,
                textShadowColor: '#000',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
                letterSpacing: 1,
            },
            container: {
                padding: 15,
                borderWidth: 0,
                borderRadius: 10,
            },
            gradient: {
                colors: ['#BDC3C7', '#2C3E50'] as [string, string],
                start: { x: 0.5, y: 0 },
                end: { x: 0.5, y: 1 },
            }
        },
        fontFamily: 'Inter_700Bold'
    },
    {
        id: 'graffiti',
        name: 'Graffiti',
        style: {
            text: {
                color: '#fff',
                fontSize: 44,
                letterSpacing: 1,
                textShadowColor: '#000',
                textShadowOffset: { width: 3, height: 3 },
                textShadowRadius: 0,
            },
            container: {
                padding: 15,
                borderWidth: 6,
                borderColor: '#000',
                borderRadius: 4,
            },
            gradient: {
                colors: ['#FF512F', '#DD2476'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }
        },
        fontFamily: 'Oswald_700Bold'
    },
];

export function getTextStickerStyleById(styleId: string): TextStickerStyle {
    return textStickerStyles.find(style => style.id === styleId) || textStickerStyles[0];
}

export function getNextTextStickerStyle(currentStyleId: string): TextStickerStyle {
    const currentIndex = textStickerStyles.findIndex(style => style.id === currentStyleId);
    const nextIndex = (currentIndex + 1) % textStickerStyles.length;
    return textStickerStyles[nextIndex];
} 