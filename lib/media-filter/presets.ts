import type { FilterPreset } from './types';

export const FILTER_PRESETS: FilterPreset[] = [
    {
        id: 'normal',
        name: 'Normal',
        thumbnailColor: '#f0f0f0',
        parameters: {
            brightness: 1,
            contrast: 1,
            saturation: 1,
            temperature: 0,
            vignette: 0,
            grayscale: false,
            sepia: 0,
        },
    },
    {
        id: 'clarendon',
        name: 'Clarendon',
        parameters: {
            contrast: 1.2,
            saturation: 1.35,
        },
        thumbnailColor: '#3D85C6',
    },
    {
        id: 'gingham',
        name: 'Gingham',
        parameters: {
            brightness: 1.05,
            saturation: 0.85,
            temperature: 0.2,
        },
        thumbnailColor: '#E6BB8A',
    },
    {
        id: 'moon',
        name: 'Moon',
        parameters: {
            grayscale: true,
            contrast: 1.9,
            brightness: 1.1,
        },
        thumbnailColor: '#CCCCCC',
    },
    {
        id: 'lark',
        name: 'Lark',
        parameters: {
            brightness: 1.2,
            saturation: 0.8,
            temperature: -0.1,
        },
        thumbnailColor: '#A2C4DD',
    },
    {
        id: 'valencia',
        name: 'Valencia',
        parameters: {
            saturation: 1.1,
            contrast: 1.1,
            temperature: 0.3,
            sepia: 0.15,
        },
        thumbnailColor: '#E6A57E',
    },
    {
        id: 'grayscale',
        name: 'Grayscale',
        parameters: {
            grayscale: true,
        },
        thumbnailColor: '#808080',
    },
    {
        id: 'sepia',
        name: 'Sepia',
        parameters: {
            sepia: 1,
        },
        thumbnailColor: '#808080',
    },
    {
        id: 'mayfair',
        name: 'Mayfair',
        parameters: {
            brightness: 1.05,
            saturation: 1.1,
            temperature: 0.15,
            vignette: 0.1,
        },
        thumbnailColor: '#E6C1D6',
    },
    {
        id: 'xpro',
        name: 'X-Pro',
        parameters: {
            contrast: 1.2,
            saturation: 1.2,
            temperature: 0.2,
            sepia: 0.25,
        },
        thumbnailColor: '#7E5746',
    },
];
