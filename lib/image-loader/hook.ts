import type { ImageSource } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useImage } from 'expo-image';
import useImageLoaderStore from './store';
import type { ImageCacheEntry, ImageVariation } from './types';
import type { UseImageLoaderOptions } from './types';
import { isVariationSufficient } from './utils';
import { useAppSettingsStore } from '@/stores/app';

interface UseImageLoaderResult {
    image: ImageSource | null;
    status: 'unknown' | 'queued' | 'loading' | 'loaded' | 'error';
    retry: () => Promise<void>;
}

export default function useImageLoader(
    url: string | false,
    options?: UseImageLoaderOptions
): UseImageLoaderResult {
    const { priority = 'normal', reqWidth = 'original', blurhash } = options ?? {};
    const _reqWidth = typeof reqWidth === 'number' ? Math.floor(reqWidth) : 'original';

    // Subscribe to cache only when URL is truthy
    const cached: ImageCacheEntry | undefined = useImageLoaderStore((state) =>
        typeof url === 'string' && url ? state.imageCache.get(url) : undefined
    );

    // Pick the best loaded variation that satisfies the requested width
    const bestLoadedVariation = useMemo<ImageVariation | null>(() => {
        if (!cached?.variations?.length) return null;
        const loaded = cached.variations.filter((v) => v.status === 'loaded' && v.source);
        if (!loaded.length) return null;
        const suitable = loaded
            .filter((v) => isVariationSufficient(v, _reqWidth))
            .sort((a, b) => {
                const aW = a.reqWidth === 'original' ? Number.POSITIVE_INFINITY : a.reqWidth;
                const bW = b.reqWidth === 'original' ? Number.POSITIVE_INFINITY : b.reqWidth;
                if (_reqWidth === 'original') return 0;
                return Math.abs(aW - _reqWidth) - Math.abs(bW - _reqWidth);
            });
        return suitable[0] ?? null;
    }, [cached, _reqWidth]);

    const bestLoaded = useMemo(
        () => ({ ...bestLoadedVariation?.source, blurhash }),
        [bestLoadedVariation, blurhash]
    );

    // Keep track of queued tasks so we can clean up
    const prevRef = useRef<{
        url: string;
        reqWidth: number | 'original';
        priority: typeof priority;
    } | null>(null);

    // Only enqueue if nothing is already loaded
    useEffect(() => {
        if (!url || bestLoadedVariation) return;

        useImageLoaderStore.getState().addToQueue(url, _reqWidth, priority);
        prevRef.current = { url, reqWidth: _reqWidth, priority };

        return () => {
            if (prevRef.current) {
                useImageLoaderStore
                    .getState()
                    .removeFromQueue(
                        prevRef.current.url,
                        prevRef.current.reqWidth,
                        prevRef.current.priority
                    );
            }
        };
    }, [url, _reqWidth, priority, !!bestLoadedVariation]);

    const status = useImageLoaderStore((state) => {
        if (typeof url !== 'string' || !url) return 'unknown' as const;
        const entry = state.imageCache.get(url);
        if (!entry) return 'unknown' as const;
        const v = entry.variations.find((v) => v.reqWidth === _reqWidth);
        return v?.status ?? 'unknown';
    });

    const retry = useCallback(async () => {
        if (url) {
            return useImageLoaderStore.getState().retry(url, _reqWidth);
        }
    }, [url, _reqWidth]);

    return useMemo<UseImageLoaderResult>(() => {
        const res = {
            image: { ...bestLoaded, blurhash },
            status,
            retry,
        };

        return res;
    }, [bestLoaded?.cacheKey, status, retry]);
}
