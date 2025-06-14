import type { ImageSource } from 'expo-image';

export interface ImageVariation {
    reqWidth: number | 'original';
    source: ImageSource | null; // { uri: either original_url or fetched_url, cacheKey: filesystemKey }
    status: 'unknown' | 'queued' | 'loading' | 'loaded' | 'error';
    attempts: number;
}

export interface ImageLoaderStats {
    fetched: Record<string, number>;
    loadingTimes: Record<string, number[]>;
}

export type ImagePriority = 'low' | 'normal' | 'high' | 'highest';

export interface ImageCacheEntry {
    variations: ImageVariation[];
}

export interface ImageLoaderOptions {
    maxConcurrentDownloads: number;
    cacheTimeout: number;
    imgProxyEnabled: boolean;
    retryAttempts: number;
    retryDelay: number;
    requestTimeout: number;
    maxCacheSize?: number;
    imgProxyDisabledUntil?: number;
}

// Renamed: QueueItem -> ImageTask
export interface ImageTask {
    originalUrl: string;
    reqWidth: number | 'original';
    refCount: number;
}

// This is the original URL of the image
type ImageCacheKey = string;

// Updated: ImageState -> ImageLoaderState with renamed properties
export interface ImageLoaderState {
    imageCache: Map<ImageCacheKey, ImageCacheEntry>;
    downloadQueues: {
        high: ImageTask[];
        normal: ImageTask[];
        low: ImageTask[];
    };
    inFlightTasks: Set<string>;
    // Track start time and timeout for each active download
    activeDownloadMeta: { [key: string]: { startTime: number; timeoutMs: number } };
    options: ImageLoaderOptions;
    stats: ImageLoaderStats;
    // Track URLs that have definitively failed to load (permanent failures)
    permanentFailures: Set<string>;
    // Track image loading failures for debug UI
    loadingFailures: ImageLoadingFailure[];
}

/**
 * Tracks a single image loading failure for debug purposes.
 */
export interface ImageLoadingFailure {
    uri: string;
    error: string;
    relativeTimeMs: number;
    reqWidth: number | 'original';
    timestamp: number;
}

export interface UseImageLoaderOptions {
    priority?: ImagePriority;
    reqWidth?: number | 'original';
    forceProxy?: boolean;
    blurhash?: string;
    timeout?: number;
}

export type ImageCacheState = 'loaded' | 'error';

export interface DbImageCacheEntry {
    /**
     * The original URL of the image.
     */
    originalUrl: string;
    width: number | null; // null for "original"
    state: ImageCacheState;
    attempts: number;
    fetchedUrl: string;

    /**
     * Identifier for the cached image, used for filesystem caching.
     */
    cacheKey: string;
}
