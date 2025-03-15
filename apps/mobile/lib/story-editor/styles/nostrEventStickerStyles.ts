import { StyleSheet } from 'react-native';

export interface NostrEventStickerStyle {
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
    layout?: {
        direction: 'row' | 'column';
        avatarSize: number;
        avatarPosition?: 'left' | 'top' | 'right';
        contentWidth?: number;
        gap: number;
    };
}

export const nostrEventStickerStyles: NostrEventStickerStyle[] = [
    {
        id: 'standard',
        name: 'Standard',
        style: {
            text: {
                color: '#fff',
                fontSize: 24,
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
                width: 300,
                maxWidth: 300,
            },
        },
        layout: {
            direction: 'row',
            avatarSize: 48,
            avatarPosition: 'left',
            gap: 8,
        }
    },
    {
        id: 'card',
        name: 'Card',
        style: {
            text: {
                color: '#fff',
                fontSize: 22,
            },
            container: {
                backgroundColor: 'rgba(50, 50, 50, 0.8)',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                width: 300,
                maxWidth: 300,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
        },
        fontFamily: 'Inter_700Bold',
        layout: {
            direction: 'row',
            avatarSize: 48,
            avatarPosition: 'left',
            gap: 10,
        }
    },
    {
        id: 'purple',
        name: 'Purple',
        style: {
            text: {
                color: '#fff',
                fontSize: 22,
            },
            container: {
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                width: 300,
                maxWidth: 300,
            },
            gradient: {
                colors: ['#8e2de2', '#4a00e0'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
            }
        },
        layout: {
            direction: 'row',
            avatarSize: 48,
            avatarPosition: 'left',
            gap: 10,
        }
    },
    {
        id: 'dark',
        name: 'Dark',
        style: {
            text: {
                color: '#fff',
                fontSize: 20,
                textShadowColor: 'rgba(0, 0, 0, 0.5)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
            },
            container: {
                backgroundColor: 'rgba(20, 20, 20, 0.95)',
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
                width: 300,
                maxWidth: 300,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
        }
    },
    {
        id: 'glass',
        name: 'Glass',
        style: {
            text: {
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: 22,
                textShadowColor: 'rgba(255, 255, 255, 0.4)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 6,
            },
            container: {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 12,
                width: 300,
                maxWidth: 300,
                shadowColor: '#fff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
        },
        fontFamily: 'Inter_700Bold'
    },
    {
        id: 'news',
        name: 'News',
        style: {
            text: {
                color: '#000',
                fontSize: 22,
            },
            container: {
                backgroundColor: '#fff',
                borderRadius: 0,
                borderLeftWidth: 4,
                borderLeftColor: '#e63946',
                paddingHorizontal: 14,
                paddingVertical: 12,
                width: 300,
                maxWidth: 300,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
        },
        fontFamily: 'Inter_700Bold'
    },
    {
        id: 'retro-post',
        name: 'Retro Post',
        style: {
            text: {
                color: '#333',
                fontSize: 20,
            },
            container: {
                backgroundColor: '#f8f3e3',
                borderRadius: 0,
                padding: 20,
                width: 300,
                maxWidth: 300,
                transform: [{ rotate: '1deg' }],
                shadowColor: '#3d5a80',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 0,
            },
        },
        fontFamily: 'PermanentMarker_400Regular'
    },
    {
        id: 'electric',
        name: 'Electric',
        style: {
            text: {
                color: '#fff',
                fontSize: 22,
                textShadowColor: '#00f2ff',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
                letterSpacing: 1,
            },
            container: {
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
                width: 300,
                maxWidth: 300,
                shadowColor: '#00f2ff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
            },
            gradient: {
                colors: ['#4b6cb7', '#182848'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }
        },
        fontFamily: 'Oswald_700Bold'
    },
    {
        id: 'magazine',
        name: 'Magazine',
        style: {
            text: {
                color: '#fff',
                fontSize: 24,
            },
            container: {
                borderRadius: 0,
                paddingHorizontal: 14,
                paddingVertical: 12,
                width: 300,
                maxWidth: 300,
                borderWidth: 0,
                borderBottomWidth: 4,
                borderBottomColor: '#fff',
            },
        }
    },
    {
        id: 'vertical-card',
        name: 'Vertical Card',
        style: {
            text: {
                color: '#fff',
                fontSize: 20,
                textAlign: 'center',
            },
            container: {
                backgroundColor: 'rgba(30, 30, 30, 0.95)',
                borderRadius: 16,
                padding: 16,
                width: 280,
                maxWidth: 280,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
                alignItems: 'center',
            },
        },
        fontFamily: 'Inter_700Bold',
        layout: {
            direction: 'column',
            avatarSize: 64,
            avatarPosition: 'top',
            gap: 12,
        }
    },
    {
        id: 'horizontal-compact',
        name: 'Horizontal Compact',
        style: {
            text: {
                color: '#fff',
                fontSize: 18,
            },
            container: {
                backgroundColor: 'rgba(50, 50, 50, 0.9)',
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                width: 260,
                maxWidth: 260,
            },
        },
        layout: {
            direction: 'row',
            avatarSize: 32,
            avatarPosition: 'left',
            contentWidth: 210,
            gap: 8,
        }
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        style: {
            text: {
                color: '#fff',
                fontSize: 22,
                letterSpacing: 0.5,
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 14,
                width: 300,
                maxWidth: 300,
            },
        },
        fontFamily: 'Inter_400Regular',
    },
    {
        id: 'quote',
        name: 'Quote',
        style: {
            text: {
                color: '#fff',
                fontSize: 20,
                fontStyle: 'italic',
                lineHeight: 28,
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 4,
                paddingHorizontal: 24,
                paddingVertical: 16,
                width: 300,
                maxWidth: 300,
                shadowColor: '#ffd700',
                shadowOffset: { width: -6, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 0,
            },
        },
        fontFamily: 'DancingScript_700Bold',
    },
    {
        id: 'neon',
        name: 'Neon',
        style: {
            text: {
                color: '#fff',
                fontSize: 22,
                textShadowColor: '#ff00ff',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                width: 300,
                maxWidth: 300,
                shadowColor: '#00ffff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 12,
            },
        },
        fontFamily: 'Oswald_400Regular',
    },
    {
        id: 'bubble',
        name: 'Bubble',
        style: {
            text: {
                color: '#333',
                fontSize: 18,
            },
            container: {
                backgroundColor: '#fff',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 12,
                width: 280,
                maxWidth: 280,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                transform: [{ rotate: '-1deg' }],
            },
            gradient: {
                colors: ['#ffffff', '#f5f5f5', '#eeeeee'] as [string, string, string],
                start: { x: 0, y: 0 },
                end: { x: 0, y: 1 },
            }
        },
        fontFamily: 'Caveat_400Regular',
    },
    {
        id: 'billboard',
        name: 'Billboard',
        style: {
            text: {
                color: '#fff',
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 2,
            },
            container: {
                paddingHorizontal: 20,
                paddingVertical: 16,
                width: 320,
                maxWidth: 320,
                borderRadius: 0,
            },
            gradient: {
                colors: ['#ff4e50', '#f9d423'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
            }
        },
        fontFamily: 'Anton_400Regular',
    },
];

export function getNostrEventStickerStyleById(styleId: string): NostrEventStickerStyle {
    return nostrEventStickerStyles.find(style => style.id === styleId) || nostrEventStickerStyles[0];
}

export function getNextNostrEventStickerStyle(currentStyleId: string): NostrEventStickerStyle {
    const currentIndex = nostrEventStickerStyles.findIndex(style => style.id === currentStyleId);
    const nextIndex = (currentIndex + 1) % nostrEventStickerStyles.length;
    return nostrEventStickerStyles[nextIndex];
} 