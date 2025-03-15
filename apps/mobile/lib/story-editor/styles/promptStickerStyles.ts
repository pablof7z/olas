import { StyleSheet } from 'react-native';

export interface PromptStickerStyle {
    id: string;
    name: string;
    style: {
        text: any;
        container: any;
        input: any;
        button: any;
        gradient?: {
            colors: [string, string] | [string, string, string];
            start?: { x: number; y: number };
            end?: { x: number; y: number };
        };
    };
    fontFamily?: string;
}

export const promptStickerStyles: PromptStickerStyle[] = [
    {
        id: 'prompt-default',
        name: 'Default',
        style: {
            text: {
                color: '#fff',
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 12,
            },
            container: {
                padding: 15,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                minWidth: 200,
                maxWidth: 300,
            },
            input: {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                padding: 8,
                color: '#fff',
                marginBottom: 10,
            },
            button: {
                backgroundColor: '#8b5cf6',
                borderRadius: 8,
                padding: 8,
                alignItems: 'center',
            }
        }
    },
    {
        id: 'prompt-playful',
        name: 'Playful',
        style: {
            text: {
                color: '#fff',
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 12,
            },
            container: {
                padding: 15,
                borderRadius: 16,
                borderWidth: 3,
                borderColor: '#ec4899',
                minWidth: 200,
                maxWidth: 300,
            },
            input: {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: 12,
                padding: 10,
                color: '#fff',
                marginBottom: 12,
                borderWidth: 2,
                borderColor: '#f472b6',
            },
            button: {
                backgroundColor: '#ec4899',
                borderRadius: 12,
                padding: 10,
                alignItems: 'center',
            },
            gradient: {
                colors: ['#4338ca', '#ec4899'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 1 },
            }
        },
        fontFamily: 'PermanentMarker_400Regular'
    },
    {
        id: 'prompt-minimal',
        name: 'Minimal',
        style: {
            text: {
                color: '#fff',
                fontSize: 16,
                marginBottom: 10,
            },
            container: {
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#64748b',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                minWidth: 180,
                maxWidth: 280,
            },
            input: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                padding: 8,
                color: '#fff',
                marginBottom: 8,
            },
            button: {
                backgroundColor: '#64748b',
                borderRadius: 6,
                padding: 6,
                alignItems: 'center',
            }
        },
        fontFamily: 'Inter_400Regular'
    }
];

// Helper function to get a style by ID
export function getPromptStickerStyleById(id: string): PromptStickerStyle {
    const style = promptStickerStyles.find((style) => style.id === id);
    return style || promptStickerStyles[0];
}

// Helper function to get the next style in the array
export function getNextPromptStickerStyle(currentId: string): PromptStickerStyle {
    const currentIndex = promptStickerStyles.findIndex((style) => style.id === currentId);
    const nextIndex = (currentIndex + 1) % promptStickerStyles.length;
    return promptStickerStyles[nextIndex];
} 