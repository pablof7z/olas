import { getImageUrl } from '@misaon/imgproxy';
import { Dimensions } from 'react-native';

const WINDOW_WIDTH = Dimensions.get('window').width;

interface ImgProxyConfig {
    baseURL?: string;
    secret?: string;
    salt?: string;
    modifiers?: {
        width?: string;
        height?: string;
        [key: string]: string | undefined;
    };
}

const DEFAULT_CONFIG: ImgProxyConfig = {
    baseURL: 'https://imgproxy.f7z.io',
    secret: '',
    salt: '',
    modifiers: {
        width: WINDOW_WIDTH.toString(),
    },
};

export function getProxiedImageUrl(url: string, size: number = WINDOW_WIDTH, factor: number = 3, config: Partial<ImgProxyConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    finalConfig.modifiers.width = Math.floor(size * factor).toString();

    return getImageUrl(url, finalConfig);
}
