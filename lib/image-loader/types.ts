import { ImageSource } from 'expo-image';

export interface ImageVariation {
  reqWidth: number | 'original';
  source: ImageSource | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  timestamp: number;
  attempts: number;
}

export interface ImageLoaderStats {
  fetched: Record<string, number>;
  loadingTimes: Record<string, number[]>;
}

export type ImagePriority = 'low' | 'normal' | 'high';

export interface ImageCacheEntry {
  blurhash?: string;
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
  url: string;
  reqWidth: number | 'original';
  blurhash?: string;
  refCount: number;
}

// Updated: ImageState -> ImageLoaderState with renamed properties
export interface ImageLoaderState {
  imageCache: Map<string, ImageCacheEntry>;
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
  // Track temporary failures: URL -> last failure timestamp (ms)
  temporaryFailures: Map<string, number>;
}

export interface UseImageLoaderOptions {
  url: string | false;
  priority?: ImagePriority;
  reqWidth?: number | 'original';
  forceProxy?: boolean;
  blurhash?: string;
  timeout?: number;
}