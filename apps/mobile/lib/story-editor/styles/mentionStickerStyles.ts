import { StyleSheet } from 'react-native';

export interface MentionStickerStyle {
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
        alignItems: 'flex-start' | 'center' | 'flex-end' | 'stretch';
        justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
        gap: number;
    };
}

export const mentionStickerStyles: MentionStickerStyle[] = [
    {
        id: 'minimal',
        name: 'Minimal',
        style: {
            text: {
                color: '#fff',
                fontSize: 24,
                fontWeight: 'bold',
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
            },
        },
        layout: {
            direction: 'row',
            avatarSize: 24,
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 8,
        }
    },
    {
        id: 'bubble',
        name: 'Bubble',
        style: {
            text: {
                color: '#fff',
                fontSize: 22,
                fontWeight: 'bold',
            },
            container: {
                backgroundColor: 'rgba(80, 80, 160, 0.9)',
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 12,
                shadowColor: 'transparent',
                margin: 0,
            },
        },
        fontFamily: 'Inter_700Bold',
        layout: {
            direction: 'row',
            avatarSize: 24,
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
        }
    },
    {
        id: 'gradient',
        name: 'Gradient',
        style: {
            text: {
                color: '#fff',
                fontSize: 24,
                fontWeight: 'bold',
                textShadowColor: 'rgba(0, 0, 0, 0.5)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 2,
            },
            container: {
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
            },
            gradient: {
                colors: ['#5f2c82', '#49a09d'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
            }
        },
        layout: {
            direction: 'row',
            avatarSize: 28,
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
        }
    },
    {
        id: 'neon',
        name: 'Neon',
        style: {
            text: {
                color: '#fff',
                fontSize: 22,
                fontWeight: 'bold',
                textShadowColor: '#00ffff',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
                shadowColor: '#00ffff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 8,
                margin: 0,
            },
        },
        layout: {
            direction: 'row',
            avatarSize: 24,
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
        }
    },
    {
        id: 'verified',
        name: 'Verified',
        style: {
            text: {
                color: '#fff',
                fontSize: 22,
                fontWeight: 'bold',
            },
            container: {
                backgroundColor: '#1DA1F2',
                borderRadius: 30,
                paddingHorizontal: 16,
                paddingVertical: 12,
                shadowColor: 'transparent',
                margin: 0,
            },
        },
        fontFamily: 'Inter_700Bold',
        layout: {
            direction: 'row',
            avatarSize: 24,
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
        }
    },
    {
        id: 'gold-badge',
        name: 'Gold Badge',
        style: {
            text: {
                color: '#000',
                fontSize: 20,
                fontWeight: 'bold',
                textShadowColor: 'rgba(255, 255, 255, 0.5)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
            },
            container: {
                borderRadius: 15,
                paddingHorizontal: 16,
                paddingVertical: 10,
                margin: 0,
                shadowColor: '#8B4513',
                shadowOffset: { width: 1, height: 1 },
                shadowOpacity: 0.5,
                shadowRadius: 0,
            },
            gradient: {
                colors: ['#FFD700', '#FFA500', '#FFD700'] as [string, string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
            }
        },
        fontFamily: 'PermanentMarker_400Regular',
        layout: {
            direction: 'row',
            avatarSize: 26,
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
        }
    },
    {
        id: 'handwritten',
        name: 'Handwritten',
        style: {
            text: {
                color: '#000',
                fontSize: 24,
                textShadowColor: 'rgba(0, 0, 0, 0.15)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 1,
            },
            container: {
                backgroundColor: '#fff9e5',
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 8,
                transform: [{ rotate: '-1deg' }],
                shadowColor: '#e6d9a3',
                shadowOffset: { width: 1, height: 1 },
                shadowOpacity: 0.5,
                shadowRadius: 0,
                margin: 0,
            },
        },
        fontFamily: 'DancingScript_700Bold',
        layout: {
            direction: 'row',
            avatarSize: 28,
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
        }
    },
    {
        id: 'futuristic',
        name: 'Futuristic',
        style: {
            text: {
                color: '#00ffff',
                fontSize: 20,
                letterSpacing: 1,
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                borderRadius: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                shadowColor: '#00ffff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                margin: 0,
            },
        },
        fontFamily: 'Anton_400Regular',
        layout: {
            direction: 'row',
            avatarSize: 24,
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 12,
        }
    },
    {
        id: 'vintage-tag',
        name: 'Vintage Tag',
        style: {
            text: {
                color: '#59371C',
                fontSize: 22,
            },
            container: {
                backgroundColor: '#E8D4B3',
                borderRadius: 4,
                paddingHorizontal: 16,
                paddingVertical: 10,
                shadowColor: '#C5A57D',
                shadowOffset: { width: 1, height: 1 },
                shadowOpacity: 0.4,
                shadowRadius: 0,
                margin: 0,
            },
        },
        fontFamily: 'Caveat_700Bold',
        layout: {
            direction: 'row',
            avatarSize: 26,
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
        }
    },
    {
        id: 'profile-card',
        name: 'Profile Card',
        style: {
            text: {
                color: '#fff',
                fontSize: 20,
                fontWeight: 'bold',
                textAlign: 'center',
                marginTop: 8,
            },
            container: {
                backgroundColor: 'rgba(40, 40, 40, 0.9)',
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                margin: 0,
            },
        },
        fontFamily: 'Inter_700Bold',
        layout: {
            direction: 'column',
            avatarSize: 60,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
        }
    },
    {
        id: 'circular-badge',
        name: 'Circular Badge',
        style: {
            text: {
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
                marginTop: 6,
            },
            container: {
                padding: 12,
                backgroundColor: 'rgba(100, 65, 165, 0.9)',
                borderRadius: 100,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                minWidth: 120,
                minHeight: 120,
            },
            gradient: {
                colors: ['#8E2DE2', '#4A00E0'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }
        },
        fontFamily: 'Inter_700Bold',
        layout: {
            direction: 'column',
            avatarSize: 48,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
        }
    },
    {
        id: 'business-card',
        name: 'Business Card',
        style: {
            text: {
                color: '#333',
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'left',
            },
            container: {
                backgroundColor: '#fff',
                borderRadius: 4,
                padding: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                minWidth: 180,
                margin: 0,
            },
        },
        fontFamily: 'Inter_400Regular',
        layout: {
            direction: 'row',
            avatarSize: 36,
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 12,
        }
    },
];

export function getMentionStickerStyleById(styleId: string): MentionStickerStyle {
    return mentionStickerStyles.find(style => style.id === styleId) || mentionStickerStyles[0];
}

export function getNextMentionStickerStyle(currentStyleId: string): MentionStickerStyle {
    const currentIndex = mentionStickerStyles.findIndex(style => style.id === currentStyleId);
    const nextIndex = (currentIndex + 1) % mentionStickerStyles.length;
    return mentionStickerStyles[nextIndex];
} 