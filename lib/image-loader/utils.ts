import { getImageUrl } from '@misaon/imgproxy';
import { Dimensions } from 'react-native';

const WINDOW_WIDTH = Dimensions.get('window').width;

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
    modifiers: {
        width: WINDOW_WIDTH.toString(),
    },
};

export function getProxiedImageUrl(
    url: string,
    size: number = WINDOW_WIDTH,
    factor = 3,
    config: Partial<ImgProxyConfig> = {}
) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    finalConfig.modifiers.width = Math.floor(size * factor).toString();
    finalConfig.modifiers.format = 'webp';
    const imageUrl = getImageUrl(url, finalConfig);
    return imageUrl;
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: any[] | null = null;
  let lastCallTime = 0;
  let leadingCalled = false;

  const throttled = function (this: any, ...args: any[]) {
    const now = Date.now();
    const callNow = options.leading && !leadingCalled;
    lastArgs = args;

    if (callNow) {
      func.apply(this, args);
      leadingCalled = true;
      lastCallTime = now;
    }

    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        if (options.trailing !== false && lastArgs) {
          func.apply(this, lastArgs);
        }
        leadingCalled = false;
        lastArgs = null;
      }, wait);
    }
  };

  return throttled as T;
}