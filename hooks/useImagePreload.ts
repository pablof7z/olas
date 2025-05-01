import { useEffect, useMemo, useState, useRef } from 'react';
import useImageStore from '@/stores/imageStore';
import type { ImageSource } from 'expo-image';
import { ImageCacheEntry } from '@/types/imageTypes';

// Simple debounce implementation
function debounce<F extends (...args: any[]) => any>(fn: F, delay: number): F {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<F>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as F;
}


import type { UseImagePreloadOptions } from '@/types/imageTypes';

/**
 * Helpers for handling reqWidth which can be a number or "original"
 */
const getMaxWidthValue = (v: { reqWidth: number | "original" }) =>
  v.reqWidth === "original" ? Number.POSITIVE_INFINITY : v.reqWidth;

/**
 * useImagePreload hook
 * - Returns the best loaded ImageSource for the requested width, and a placeholder (closest loaded or blurhash)
 * - Returns: { loaded, placeholder, isLoading, isLoaded, error, retry }
 */
export default function useImagePreload({
  url,
  priority = 'normal',
  reqWidth = "original",
  blurhash,
}: UseImagePreloadOptions): ImageSource | null {
  const [debouncedProcessQueue] = useState(() => debounce(() => useImageStore.getState().processQueue(), 200));

  // Add to queue when URL or reqWidth changes
  const prevRef = useRef<{ url: string; reqWidth: number | "original"; priority: typeof priority } | null>(null);

  useEffect(() => {
    if (!url) return;
    useImageStore.getState().addToQueue(url, reqWidth, blurhash, priority);
    debouncedProcessQueue();
    prevRef.current = { url, reqWidth, priority };

    // Cleanup: remove from queue when unmounting or dependencies change
    return () => {
      if (prevRef.current) {
        useImageStore.getState().removeFromQueue(
          prevRef.current.url,
          prevRef.current.reqWidth,
          prevRef.current.priority
        );
      }
    };
  }, [url, reqWidth, priority, debouncedProcessQueue]);

  // Use just the URL as the cache key
  const cached: ImageCacheEntry | undefined = useImageStore(state => state.cache.get(url));

  // Find the best loaded variation for the requested width
  const bestLoaded = useMemo(() => {
    if (!cached?.variations?.length) return null;
    // Filter loaded variations
    const loadedVars = cached.variations.filter(v => v.status === 'loaded' && v.source);
    if (!loadedVars.length) return null;
    // Find the largest loaded variation <= reqWidth
    const isOriginal = (v: typeof loadedVars[number]) => v.reqWidth === "original";
    const getMaxWidthValue = (v: typeof loadedVars[number]) =>
      v.reqWidth === "original" ? Number.POSITIVE_INFINITY : v.reqWidth;

    const suitable = loadedVars
      .filter(v =>
        isOriginal(v) ||
        (typeof v.reqWidth === "number" && typeof reqWidth === "number" && v.reqWidth <= reqWidth)
      )
      .sort((a, b) => getMaxWidthValue(b) - getMaxWidthValue(a));
    if (suitable.length) return { ...suitable[0].source, blurhash: blurhash ?? cached.blurhash };
    // Otherwise, use the smallest loaded variation > reqWidth
    const larger = loadedVars
      .filter(
        v =>
          !isOriginal(v) &&
          typeof v.reqWidth === "number" &&
          typeof reqWidth === "number" &&
          v.reqWidth > reqWidth
      )
      .sort((a, b) => getMaxWidthValue(a) - getMaxWidthValue(b));
    if (larger.length) return { ...larger[0].source, blurhash: blurhash ?? cached.blurhash };
    // Fallback: closest loaded variation
    const source = loadedVars
      .sort((a, b) => {
        if (typeof reqWidth !== "number") return 0;
        return (
          Math.abs(getMaxWidthValue(a) - reqWidth) -
          Math.abs(getMaxWidthValue(b) - reqWidth)
        );
      })[0].source;
      if (source) return { ...source, blurhash: blurhash ?? cached.blurhash };
  }, [cached, reqWidth]);

  // Find a placeholder: closest loaded variation (even if not suitable), or blurhash
  const bestICanDo = useMemo(() => {
    if (bestLoaded) return bestLoaded;
    const loadedVars = cached?.variations.filter(v => v.status === 'loaded' && v.source);
    if (loadedVars?.length) {
      const source = loadedVars.sort((a, b) => {
        if (typeof reqWidth !== "number") return 0;
        return (
          Math.abs(getMaxWidthValue(a) - reqWidth) -
          Math.abs(getMaxWidthValue(b) - reqWidth)
        );
      })[0];

      if (source?.source) return { ...source.source, blurhash };
    }
    const b = blurhash ?? cached?.blurhash;
    if (b)
      return { blurhash: b };
    return null;
  }, [cached, bestLoaded, reqWidth, blurhash]);

  // // Retry function
  // const retry = () => {
  //   useImageStore.getState().addToQueue(url, reqWidth, blurhash, 'high');
  //   debouncedProcessQueue();
  // };

  console.log('useImagePreload', { url, reqWidth, priority, blurhash });

  return bestLoaded ?? bestICanDo;
}