import { ImageSource } from 'expo-image';

export interface ImageVariation {
  reqWidth: number | 'original';
  source: ImageSource | null;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  timestamp: number;
  attempts: number;
}

export interface SessionStats {
  fetched: Record<string, number>;
  failedImgProxy: Record<string, number>;
  failedSource: Record<string, number>;
  cacheHits: Record<string, number>;
  loadingTimes: Record<string, number[]>;
}

export type ImagePriority = 'low' | 'normal' | 'high';

export interface ImageCacheEntry {
  blurhash?: string;
  variations: ImageVariation[];
}

export interface ImageStoreConfig {
  maxConcurrentDownloads: number;
  cacheTimeout: number;
  imgProxyEnabled: boolean;
  imgProxyFailCount: number;
  imgProxyFailThreshold: number;
  retryAttempts: number;
  retryDelay: number;
  requestTimeout: number;
  maxCacheSize?: number;
}

// New: QueueItem interface
export interface QueueItem {
  url: string;
  reqWidth: number | 'original';
  blurhash?: string;
  refCount: number;
}

// Updated: ImageState interface with QueueItem[]
export interface ImageState {
  cache: Map<string, ImageCacheEntry>;
  queues: {
    high: QueueItem[];
    normal: QueueItem[];
    low: QueueItem[];
  };
  activeDownloads: Set<string>;
  // Track start time and timeout for each active download
  activeDownloadMeta: { [key: string]: { startTime: number; timeoutMs: number } };
  config: ImageStoreConfig;
  sessionStats: SessionStats;
  // Track URLs that have definitively failed to load (permanent failures)
  permanentlyFailedUrls: Set<string>;
  // Track temporary failures: URL -> last failure timestamp (ms)
  temporaryFailedUrls: Map<string, number>;
}

export interface UseImagePreloadOptions {
  url: string | false;
  priority?: ImagePriority;
  reqWidth?: number | 'original';
  forceProxy?: boolean;
  blurhash?: string;
  timeout?: number;
}
