import type { ImageSource } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import useImageLoaderStore from './store';
import type { ImageCacheEntry, ImageVariation } from './types';
import type { UseImageLoaderOptions } from './types';
import { isVariationSufficient } from './utils';

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

    const cached: ImageCacheEntry | undefined = useImageLoaderStore((state) =>
        typeof url === 'string' && url ? state.imageCache.get(url) : undefined
    );

    // Select the best variation to show immediately
    const bestLoadedVariation = useMemo<ImageVariation | null>(() => {
        if (!cached?.variations?.length) {
            console.log(`[bestLoadedVariation] No cached variations.`);
            return null;
        }

        const loaded = cached.variations.filter(v => v.status === 'loaded' && v.source);
        if (!loaded.length) {
            console.log(`[bestLoadedVariation] No loaded variations.`, url);
            return null;
        }

        // Find suitable variation
        const suitable = loaded
            .filter(v => isVariationSufficient(v, _reqWidth))
            .sort((a, b) => {
                const aW = a.reqWidth === 'original' ? Infinity : a.reqWidth;
                const bW = b.reqWidth === 'original' ? Infinity : b.reqWidth;
                return _reqWidth === 'original'
                    ? 0
                    : Math.abs(aW - _reqWidth) - Math.abs(bW - _reqWidth);
            });

        if (suitable.length) {
            console.log(
                `[bestLoadedVariation] Returning suitable variation (width=${suitable[0].reqWidth}), requested=${_reqWidth}`, url
            );
            return suitable[0];
        }

        // Fallback to smaller variation temporarily
        const smaller = loaded
            .filter(
                v => v.reqWidth !== 'original' && (_reqWidth === 'original' || (v.reqWidth as number) < _reqWidth)
            )
            .sort((a, b) => (b.reqWidth as number) - (a.reqWidth as number));

        if (smaller.length) {
            console.log(
                `[bestLoadedVariation] No suitable variation. Falling back to smaller variation (width=${smaller[0].reqWidth}), requested=${_reqWidth}`
            );
            return smaller[0];
        }

        console.log(`[bestLoadedVariation] No suitable or smaller variations found.`);
        return null;
    }, [cached, _reqWidth]);

    const bestLoaded = useMemo(
        () => ({ ...bestLoadedVariation?.source, blurhash }),
        [bestLoadedVariation, blurhash]
    );

    const prevRef = useRef<{
        url: string;
        reqWidth: number | 'original';
        priority: typeof priority;
    } | null>(null);

    // Improved enqueue logic: queue only if no sufficient variation exists yet
    useEffect(() => {
        if (!url) return;

        const hasSufficientVariation = cached?.variations.some(
            v => v.status === 'loaded' && isVariationSufficient(v, _reqWidth)
        );

        if (!hasSufficientVariation) {
            console.log(`[useImageLoader] Enqueuing variation: URL=${url}, width=${_reqWidth}`);
            useImageLoaderStore.getState().addToQueue(url, _reqWidth, priority);
            prevRef.current = { url, reqWidth: _reqWidth, priority };
        }

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
    }, [url, _reqWidth, priority, cached]);

    const status = useImageLoaderStore((state) => {
        if (typeof url !== 'string' || !url) return 'unknown' as const;
        const entry = state.imageCache.get(url);
        if (!entry) return 'unknown' as const;
        const exactVariation = entry.variations.find(v => v.reqWidth === _reqWidth);
        return exactVariation?.status ?? 'unknown';
    });

    const retry = useCallback(async () => {
        if (url) {
            return useImageLoaderStore.getState().retry(url, _reqWidth);
        }
    }, [url, _reqWidth]);

    return useMemo<UseImageLoaderResult>(() => {
        return {
            image: bestLoaded,
            status,
            retry,
        };
    }, [bestLoaded?.cacheKey, status, retry]);
}
