import { StyleSheet } from 'react-native';

export interface TextStyle {
    id: string;
    name: string;
    style: {
        text: any;
        container: any;
    };
}

export const textStyles: TextStyle[] = [
    {
        id: 'default',
        name: 'Default',
        style: {
            text: {
                color: 'white',
                fontSize: 32,
                textShadowColor: 'rgba(0, 0, 0, 0.75)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
            },
            container: {
                padding: 10,
            },
        },
    },
    {
        id: 'bold-black',
        name: 'Bold Black',
        style: {
            text: {
                color: 'white',
                fontSize: 32,
                fontWeight: 'bold',
            },
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 10,
                borderRadius: 10,
            },
        },
    },
    {
        id: 'red-outline',
        name: 'Red Outline',
        style: {
            text: {
                color: 'red',
                fontSize: 32,
                fontWeight: 'bold',
                textShadowColor: 'rgba(0, 0, 0, 0.75)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
            },
            container: {
                padding: 10,
                borderWidth: 2,
                borderColor: 'red',
                borderRadius: 10,
            },
        },
    },
    {
        id: 'neon',
        name: 'Neon',
        style: {
            text: {
                color: '#00ff00',
                fontSize: 32,
                fontWeight: 'bold',
                textShadowColor: '#00ff00',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
            },
            container: {
                padding: 10,
            },
        },
    },
    {
        id: 'minimal',
        name: 'Minimal',
        style: {
            text: {
                color: 'white',
                fontSize: 28,
                fontWeight: '300',
            },
            container: {
                padding: 10,
            },
        },
    },
];

export function getNextStyle(currentStyleId: string): TextStyle {
    const currentIndex = textStyles.findIndex(style => style.id === currentStyleId);
    const nextIndex = (currentIndex + 1) % textStyles.length;
    return textStyles[nextIndex];
}

export function getStyleById(styleId: string): TextStyle {
    return textStyles.find(style => style.id === styleId) || textStyles[0];
} 