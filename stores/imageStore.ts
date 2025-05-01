import { create } from 'zustand';
import { Dimensions } from 'react-native';
import { getProxiedImageUrl } from '@/utils/imgproxy';
import { Image, ImageSource } from 'expo-image';
import type {
  SessionStats,
  ImagePriority,
  ImageCacheEntry,
  ImageStoreConfig,
  ImageVariation,
  QueueItem,
  ImageState
} from '../types/imageTypes';

// Helper to extract base URL from cache key
function extractBaseUrl(key: string): string {
  const idx = key.indexOf('|');
  return idx === -1 ? key : key.slice(0, idx);
}

// Helper to check if a cached image is large enough for the requested size
function isImageLargeEnough(
  variation: ImageVariation | undefined,
  reqWidth: number | "original"
): boolean {
  if (!variation) return false;

  // if the variation we have is original then it's definitely large enough
  if (variation.reqWidth === 'original') return true;
  
  // if the requested width is original we know we don't have it
  if (reqWidth === 'original') return false;

  // both have sizes
  return variation.reqWidth >= reqWidth;
}

// Helper to create a unique key for a queue item
function queueItemKey(item: QueueItem): string {
  return `${item.url}|${item.reqWidth}`;
}

// Helper to check if a queue contains a specific item
function queueContains(queue: QueueItem[], item: QueueItem): boolean {
  return queue.some(q => q.url === item.url && q.reqWidth === item.reqWidth);
}

interface ImageActions {
  addToQueue: (url: string, reqWidth: number | "original", blurhash?: string, priority?: ImagePriority) => void;
  processQueue: () => Promise<void>;
  loadImage: (image: QueueItem) => Promise<void>;
  clearCache: () => void;
  updateConfig: (config: Partial<ImageStoreConfig>) => void;
  removeFromQueue: (url: string, reqWidth: number | "original", priority?: ImagePriority) => void;
}
 
const useImageStore = create<ImageState & ImageActions>()((set, get) => ({
  cache: new Map(),
  queues: {
    high: [],
    normal: [],
    low: []
  },
  activeDownloads: new Set(),
  activeDownloadMeta: {},
  config: {
    maxConcurrentDownloads: 10,
    cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
    imgProxyEnabled: true,
    imgProxyFailCount: 0,
    imgProxyFailThreshold: 5,
    retryAttempts: 3,
    retryDelay: 1000,
    requestTimeout: 10000
  },
  sessionStats: {
    fetched: {},
    failedImgProxy: {},
    failedSource: {},
    cacheHits: {},
    loadingTimes: {},
  },
  permanentlyFailedUrls: new Set(),
  temporaryFailedUrls: new Map(),

  addToQueue: (url, reqWidth, blurhash, priority = 'normal') => {
    set((state) => {
      const queue = state.queues[priority];
      const cacheEntry = state.cache.get(url);
      // Check if cache has a variation that is large enough
      if (cacheEntry && cacheEntry.variations.some(v => isImageLargeEnough(v, reqWidth))) {
        // Already cached with sufficient width, do not add to queue
        return state;
      }
      // Find if the item already exists in the queue
      const existingIdx = queue.findIndex(q => q.url === url && q.reqWidth === reqWidth);
      if (existingIdx !== -1) {
        // Increment refCount
        const updatedQueue = queue.map((q, idx) =>
          idx === existingIdx ? { ...q, refCount: q.refCount + 1 } : q
        );
        return {
          queues: {
            ...state.queues,
            [priority]: updatedQueue
          }
        };
      } else {
        // Add new item with refCount 1
        const item: QueueItem = { url, reqWidth, blurhash, refCount: 1 };
        console.log(`[ImageStore] Queuing image: ${url} (width: ${reqWidth}, priority: ${priority})`);
        return {
          queues: {
            ...state.queues,
            [priority]: [...queue, item]
          }
        };
      }
    });
  },

  processQueue: async () => {
    const { activeDownloads, config, queues } = get();
    if (activeDownloads.size >= config.maxConcurrentDownloads) {
      console.log(`[ImageStore] Max concurrent downloads reached (${activeDownloads.size}/${config.maxConcurrentDownloads}).`);
      return;
    }

    // Get highest priority item available
    const nextItem: QueueItem | undefined =
      queues.high[0] || queues.normal[0] || queues.low[0];
    if (!nextItem) {
      console.log('[ImageStore] No images in queue to process.');
      return;
    }

    const key = queueItemKey(nextItem);

    // Remove from queue (regardless of refCount, since we're starting the download)
    set((state) => {
      let priority: ImagePriority = 'low';
      if (state.queues.high.length && queueItemKey(state.queues.high[0]) === key) priority = 'high';
      else if (state.queues.normal.length && queueItemKey(state.queues.normal[0]) === key) priority = 'normal';

      console.log(`[ImageStore] Starting prefetch for: ${key} (priority: ${priority})`);
      return {
        queues: {
          ...state.queues,
          [priority]: state.queues[priority].filter(q => queueItemKey(q) !== key)
        },
        activeDownloads: new Set(state.activeDownloads).add(key),
        activeDownloadMeta: {
          ...state.activeDownloadMeta,
          [key]: {
            startTime: Date.now(),
            timeoutMs: config.requestTimeout
          }
        }
      };
    });

    try {
      await get().loadImage(nextItem);
    } finally {
      set((state) => {
        const newDownloads = new Set(state.activeDownloads);
        newDownloads.delete(key);
        // Remove metadata for this download
        const { [key]: _, ...restMeta } = state.activeDownloadMeta;
        return {
          activeDownloads: newDownloads,
          activeDownloadMeta: restMeta
        };
      });
      get().processQueue(); // Process next item
    }
  },

  loadImage: async (queueItem) => {
    const { config, cache, addToQueue, sessionStats, permanentlyFailedUrls, temporaryFailedUrls } = get();
    const key = `${queueItem.url}|${queueItem.reqWidth}`;
    const timeoutMs = config.requestTimeout;

    // First check filesystem cache
    try {
      const cachePath = await Image.getCachePathAsync(key);
      if (cachePath) {
        console.log(`[ImageStore] Found in filesystem cache: ${key}`);
        set((state) => {
          const newCache = new Map(state.cache);
          newCache.set(key, {
            variations: [
              {
                reqWidth: queueItem.reqWidth,
                source: { uri: cachePath },
                status: 'loaded',
                timestamp: Date.now(),
                attempts: 1
              }
            ]
          });
          return { cache: newCache };
        });
        return;
      }
    } catch (e) {
      console.warn(`[ImageStore] Error checking filesystem cache for ${key}:`, e);
    }
    // Main image loading logic
    if (permanentlyFailedUrls.has(queueItem.url)) {
      console.warn(`[ImageStore] Skipping permanently failed URL: ${queueItem.url}`);
      return;
    }

    let attempts = 0;
    let lastError: any = null;
    let loadedSource: ImageSource | null = null;
    let usedProxy = false;

    while (attempts < config.retryAttempts) {
      attempts++;
      try {
        let imageUrl = queueItem.url;
        usedProxy = false;

        // Use imgproxy if enabled and not over threshold
        if (config.imgProxyEnabled && config.imgProxyFailCount < config.imgProxyFailThreshold) {
          imageUrl = getProxiedImageUrl(queueItem.url, queueItem.reqWidth === 'original' ? Dimensions.get('window').width : queueItem.reqWidth);
          usedProxy = true;
        }

        // Try to prefetch the image
        await Image.loadAsync({ uri: imageUrl, cacheKey: key });

        loadedSource = { uri: imageUrl };
        break; // Success
      } catch (err) {
        lastError = err;
        console.warn(`[ImageStore] Prefetch attempt ${attempts} failed for ${queueItem.url}:`, err);
        await new Promise(res => setTimeout(res, config.retryDelay));
      }
    }

    if (loadedSource) {
      set((state) => {
        const newCache = new Map(state.cache);
        const prevEntry = newCache.get(queueItem.url) || { blurhash: queueItem.blurhash, variations: [] };
        // Remove any previous variation for this reqWidth
        const newVariations = prevEntry.variations.filter(v => v.reqWidth !== queueItem.reqWidth);
        newVariations.push({
          reqWidth: queueItem.reqWidth,
          source: loadedSource,
          status: 'loaded',
          timestamp: Date.now(),
          attempts,
        });
        newCache.set(queueItem.url, {
          ...prevEntry,
          variations: newVariations
        });

        // Update session stats
        const newSessionStats = { ...state.sessionStats };
        if (!newSessionStats.fetched[queueItem.url]) newSessionStats.fetched[queueItem.url] = 0;
        newSessionStats.fetched[queueItem.url] += 1;
        if (!newSessionStats.loadingTimes[queueItem.url]) newSessionStats.loadingTimes[queueItem.url] = [];
        newSessionStats.loadingTimes[queueItem.url].push(Date.now());

        // If proxy failed, increment fail count
        let imgProxyFailCount = state.config.imgProxyFailCount;
        if (usedProxy && !loadedSource) {
          imgProxyFailCount += 1;
        }

        return {
          cache: newCache,
          sessionStats: newSessionStats,
          config: {
            ...state.config,
            imgProxyFailCount
          }
        };
      });
    } else {
      // Mark as failed
      set((state) => {
        const newSessionStats = { ...state.sessionStats };
        if (!newSessionStats.failedSource[queueItem.url]) newSessionStats.failedSource[queueItem.url] = 0;
        newSessionStats.failedSource[queueItem.url] += 1;

        // Mark as temporarily failed
        const newTempFails = new Map(state.temporaryFailedUrls);
        newTempFails.set(queueItem.url, Date.now());

        // If too many failures, mark as permanently failed
        const newPermFails = new Set(state.permanentlyFailedUrls);
        if (newSessionStats.failedSource[queueItem.url] >= config.retryAttempts) {
          newPermFails.add(queueItem.url);
        }

        return {
          sessionStats: newSessionStats,
          temporaryFailedUrls: newTempFails,
          permanentlyFailedUrls: newPermFails
        };
      });
      console.error(`[ImageStore] Failed to load image after ${config.retryAttempts} attempts: ${queueItem.url}`, lastError);
    }
  },

  clearCache: () => {
    set(() => ({
      cache: new Map(),
      sessionStats: {
        fetched: {},
        failedImgProxy: {},
        failedSource: {},
        cacheHits: {},
        loadingTimes: {},
      }
    }));
  },

  updateConfig: (config) => {
    set((state) => ({
      config: { ...state.config, ...config }
    }));
  },

  removeFromQueue: (url, reqWidth, priority) => {
    set((state) => {
      const priorities: ImagePriority[] = priority ? [priority] : ['high', 'normal', 'low'];
      let updatedQueues = { ...state.queues };
      let removed = false;

      for (const p of priorities) {
        const queue = state.queues[p];
        const idx = queue.findIndex(q => q.url === url && q.reqWidth === reqWidth);
        if (idx !== -1) {
          const item = queue[idx];
          if (item.refCount > 1) {
            // Decrement refCount
            updatedQueues[p] = queue.map((q, i) =>
              i === idx ? { ...q, refCount: q.refCount - 1 } : q
            );
            console.log(`[ImageStore] Decremented refCount for image: ${url} (width: ${reqWidth}, priority: ${p}), new refCount: ${item.refCount - 1}`);
          } else {
            // Remove item
            updatedQueues[p] = queue.filter((_, i) => i !== idx);
            console.log(`[ImageStore] Removed image from queue: ${url} (width: ${reqWidth}, priority: ${p})`);
          }
          removed = true;
          break; // Only remove from one queue
        }
      }

      if (!removed) {
        console.log(`[ImageStore] Tried to remove image not found in queue: ${url} (width: ${reqWidth}, priority: ${priority ?? 'any'})`);
      }

      return { queues: updatedQueues };
    });
  }
}));

export default useImageStore;