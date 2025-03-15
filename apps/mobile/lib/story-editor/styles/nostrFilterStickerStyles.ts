import { StyleSheet } from 'react-native';

export interface NostrFilterStickerStyle {
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

export const nostrFilterStickerStyles: NostrFilterStickerStyle[] = [
    {
        id: 'filter-default',
        name: 'Filter Default',
        style: {
            text: {
                color: '#fff',
                fontSize: 16,
                fontWeight: 'bold',
            },
            container: {
                padding: 15,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#4299e1',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                minWidth: 200,
            },
        }
    },
    {
        id: 'filter-code',
        name: 'Filter Code',
        style: {
            text: {
                color: '#a3e635',
                fontSize: 14,
                fontFamily: 'monospace',
            },
            container: {
                padding: 15,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: '#2dd4bf',
                backgroundColor: 'rgba(10, 10, 20, 0.9)',
                minWidth: 250,
            },
            gradient: {
                colors: ['rgba(17, 24, 39, 0.95)', 'rgba(31, 41, 55, 0.95)'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 0, y: 1 },
            }
        }
    },
    {
        id: 'filter-terminal',
        name: 'Terminal',
        style: {
            text: {
                color: '#10b981',
                fontSize: 14,
                fontFamily: 'monospace',
            },
            container: {
                padding: 15,
                borderRadius: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                minWidth: 250,
            },
            gradient: {
                colors: ['rgba(0, 0, 0, 0.9)', 'rgba(17, 24, 39, 0.98)'] as [string, string],
                start: { x: 0, y: 0 },
                end: { x: 0, y: 1 },
            }
        }
    }
];

// Helper function to get a style by ID
export function getNostrFilterStickerStyleById(id: string): NostrFilterStickerStyle {
    const style = nostrFilterStickerStyles.find((style) => style.id === id);
    return style || nostrFilterStickerStyles[0];
}

// Helper function to get the next style in the array
export function getNextNostrFilterStickerStyle(currentId: string): NostrFilterStickerStyle {
    const currentIndex = nostrFilterStickerStyles.findIndex((style) => style.id === currentId);
    const nextIndex = (currentIndex + 1) % nostrFilterStickerStyles.length;
    return nostrFilterStickerStyles[nextIndex];
} 