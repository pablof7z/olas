import { getImageUrl } from '@misaon/imgproxy';

interface ImgProxyConfig {
    baseURL?: string;
    secret: string;
    salt: string;
    modifiers: {
        width?: string;
        height?: string;
        [key: string]: string | undefined;
    };
}

const DEFAULT_CONFIG: ImgProxyConfig = {
    baseURL: 'https://imgproxy.f7z.io',
    secret: '',
    salt: '',
    modifiers: {},
};

export function getProxiedImageUrl(url: string, size: number = 800, factor: number = 3, config: Partial<ImgProxyConfig> = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    finalConfig.modifiers.width = Math.floor(size * factor).toString();
    const imageUrl = getImageUrl(url, finalConfig);
    return imageUrl;
}
