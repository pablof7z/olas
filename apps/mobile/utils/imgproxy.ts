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

export function getProxiedImageUrl(
    url: string,
    config: Partial<ImgProxyConfig> = {}
) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    return getImageUrl(url, finalConfig);
}
