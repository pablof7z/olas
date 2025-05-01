import { useEffect, useMemo, useRef, useCallback } from 'react';
import useImageLoaderStore from './store';
import type { ImageSource } from 'expo-image';
import type { ImageCacheEntry } from './types';
import type { UseImageLoaderOptions } from './types';

interface UseImageLoaderResult {
  image: ImageSource | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  retry: () => void;
}


/**
 * useImageLoader hook
 * - Returns the best loaded ImageSource for the requested width, and status and retry.
 */
export default function useImageLoader({
  originalUrl,
  priority = 'normal',
  reqWidth = "original",
  blurhash,
}: UseImageLoaderOptions): UseImageLoaderResult {
  // Track previous params for cleanup
  const prevRef = useRef<{ originalUrl: string; reqWidth: number | "original"; priority: typeof priority } | null>(null);

  useEffect(() => {
    if (!originalUrl) return;
    useImageLoaderStore.getState().addToQueue(originalUrl, reqWidth, priority);
    prevRef.current = { originalUrl, reqWidth, priority };

    // Cleanup: remove from queue when unmounting or originalUrl changes
    return () => {
      if (prevRef.current) {
        useImageLoaderStore.getState().removeFromQueue(
          prevRef.current.originalUrl,
          prevRef.current.reqWidth,
          prevRef.current.priority
        );
      }
    };
  }, [originalUrl]);

  // Use just the originalUrl as the cache key
  const cacheKey = typeof originalUrl === 'string' ? originalUrl : '';
  const cached: ImageCacheEntry | undefined = useImageLoaderStore(state => state.imageCache.get(cacheKey));

  // Find the best loaded variation for the requested width
  const bestLoaded = useMemo(() => {
    if (!cached?.variations?.length) return null;
    const loadedVars = cached.variations.filter(v => v.status === 'loaded' && v.source);
    if (!loadedVars.length) return null;
    const isOriginal = (v: typeof loadedVars[number]) => v.reqWidth === "original";
    const getMaxWidthValueVar = (v: typeof loadedVars[number]) =>
      v.reqWidth === "original" ? Number.POSITIVE_INFINITY : v.reqWidth;

    const suitable = loadedVars
      .filter(v =>
        isOriginal(v) ||
        (typeof v.reqWidth === "number" && typeof reqWidth === "number" && v.reqWidth <= reqWidth)
      )
      .sort((a, b) => getMaxWidthValueVar(b) - getMaxWidthValueVar(a));
    if (suitable.length) return { ...suitable[0].source, blurhash };
    const larger = loadedVars
      .filter(
        v =>
          !isOriginal(v) &&
          typeof v.reqWidth === "number" &&
          typeof reqWidth === "number" &&
          v.reqWidth > reqWidth
      )
      .sort((a, b) => getMaxWidthValueVar(a) - getMaxWidthValueVar(b));
    if (larger.length) return { ...larger[0].source, blurhash };
    const source = loadedVars
      .sort((a, b) => {
        if (typeof reqWidth !== "number") return 0;
        return (
          Math.abs(getMaxWidthValueVar(a) - reqWidth) -
          Math.abs(getMaxWidthValueVar(b) - reqWidth)
        );
      })[0].source;
    if (source) return { ...source, blurhash };
    return null;
  }, [cached, reqWidth, blurhash]);

  // Error state: permanent failure or any variation has status 'error'
  const hasPermanentError = useImageLoaderStore(state => state.permanentFailures.has(originalUrl as string));
  const hasVariationError = !!cached?.variations?.some(v => v.status === 'error');

  // Status calculation
  let status: UseImageLoaderResult['status'] = 'idle';
  if (!originalUrl) {
    status = 'idle';
  } else if (hasPermanentError || hasVariationError) {
    status = 'error';
  } else if (!cached) {
    status = 'loading';
  } else if (bestLoaded) {
    status = 'loaded';
  } else {
    status = 'loading';
  }

  // Retry callback, stable identity
  const retry = useCallback(() => {
    if (originalUrl) {
      useImageLoaderStore.getState().retry(originalUrl, reqWidth);
    }
  }, [originalUrl, reqWidth]);

  // Memoize result object for referential stability
  const result = useMemo<UseImageLoaderResult>(() => ({
    image: { ...bestLoaded, blurhash },
    status,
    retry,
  }), [bestLoaded?.cacheKey, status, retry]);

  return result;
}