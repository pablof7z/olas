import { StyleSheet } from 'react-native';

export interface CountdownStickerStyle {
    id: string;
    name: string;
    style: {
        text: any;
        container: any;
        countdown?: any;
        gradient?: {
            colors: [string, string] | [string, string, string];
            start?: { x: number; y: number };
            end?: { x: number; y: number };
        };
    };
    fontFamily?: string;
    layout?: {
        direction: 'row' | 'column';
        iconSize?: number;
        showIcon?: boolean;
        alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
        justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
        gap?: number;
    };
}

export const countdownStickerStyles: CountdownStickerStyle[] = [
    {
        id: 'minimal',
        name: 'Minimal',
        style: {
            text: {
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '600',
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: 10,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
            },
        },
        layout: {
            direction: 'row',
            iconSize: 20,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        }
    },
    {
        id: 'bubble',
        name: 'Bubble',
        style: {
            text: {
                color: '#333333',
                fontSize: 16,
                fontWeight: '600',
            },
            container: {
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                flexDirection: 'row',
                alignItems: 'center',
            },
        },
        layout: {
            direction: 'row',
            iconSize: 18,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        }
    },
    {
        id: 'gradient',
        name: 'Gradient',
        style: {
            text: {
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '600',
            },
            container: {
                borderRadius: 12,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
            },
            gradient: {
                colors: ['#FF4D4D', '#FF00FF'],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            },
        },
        layout: {
            direction: 'row',
            iconSize: 20,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        }
    },
    {
        id: 'neon',
        name: 'Neon',
        style: {
            text: {
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '600',
                textShadowColor: '#FF00FF',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#FF00FF',
                padding: 12,
                shadowColor: '#FF00FF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
            },
        },
        layout: {
            direction: 'row',
            iconSize: 18,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        }
    },
    {
        id: 'vertical-clock',
        name: 'Vertical Clock',
        style: {
            text: {
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '600',
                textAlign: 'center',
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: 15,
                padding: 16,
                alignItems: 'center',
            },
        },
        layout: {
            direction: 'column',
            iconSize: 34,
            showIcon: true,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
        }
    },
    {
        id: 'circular',
        name: 'Circular Badge',
        style: {
            text: {
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '700',
                textAlign: 'center',
            },
            container: {
                backgroundColor: '#4B0082',
                borderRadius: 50,
                width: 100,
                height: 100,
                padding: 10,
                justifyContent: 'center',
                alignItems: 'center',
            },
        },
        fontFamily: 'Roboto_700Bold',
        layout: {
            direction: 'column',
            iconSize: 28,
            showIcon: true,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
        }
    },
    {
        id: 'minimal-text',
        name: 'Text Only',
        style: {
            text: {
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: '700',
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 8,
                padding: 12,
            },
        },
        fontFamily: 'Inter_700Bold',
        layout: {
            direction: 'row',
            showIcon: false,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0
        }
    },
    {
        id: 'glass',
        name: 'Glass Effect',
        style: {
            text: {
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '500',
            },
            container: {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 15,
                backdropFilter: 'blur(10px)',
            },
        },
        fontFamily: 'Poppins_500Medium',
        layout: {
            direction: 'row',
            iconSize: 20,
            showIcon: true,
            alignItems: 'center',
            gap: 8
        }
    }
];

export const getCountdownStickerStyleById = (id: string) => {
    return countdownStickerStyles.find((style) => style.id === id) || countdownStickerStyles[0];
};

export const getNextCountdownStickerStyle = (currentId: string) => {
    const currentIndex = countdownStickerStyles.findIndex((style) => style.id === currentId);
    const nextIndex = (currentIndex + 1) % countdownStickerStyles.length;
    return countdownStickerStyles[nextIndex];
}; 