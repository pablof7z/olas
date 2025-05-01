import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Dimensions } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import type {
  ImageLoaderStats,
  ImagePriority,
  ImageCacheEntry,
  ImageLoaderOptions,
  ImageVariation,
  ImageTask,
  ImageLoaderState
} from './types';
import { getProxiedImageUrl, throttle } from './utils';

// In-memory array to track proxy fallback successes
const proxySuccessTimestamps: number[] = [];

// Helper to create a unique key for a queue item
function queueItemKey(item: ImageTask): string {
  return `${item.url}|${item.reqWidth}`;
}

// Helper to check if a queue contains a specific item

interface ImageActions {
  addToQueue: (url: string, reqWidth: number | "original", blurhash?: string, priority?: ImagePriority) => void;
  processQueue: () => Promise<void>;
  loadImage: (image: ImageTask) => Promise<void>;
  clearCache: () => void;
  updateConfig: (config: Partial<ImageLoaderOptions>) => void;
  removeFromQueue: (url: string, reqWidth: number | "original", priority?: ImagePriority) => void;
}

const useImageLoaderStore = create<ImageLoaderState & ImageActions>()(
  immer(
    (set, get) => {
    // Record a successful fallback from proxy to direct, and manage disabling proxy if needed
    function recordProxyFailureSuccess() {
      const now = Date.now();
      // Keep only timestamps within the last 5 minutes
      while (proxySuccessTimestamps.length && proxySuccessTimestamps[0] < now - 5 * 60 * 1000) {
        proxySuccessTimestamps.shift();
      }
      proxySuccessTimestamps.push(now);
      if (proxySuccessTimestamps.length >= 3) {
        // Disable proxy for 60 minutes
        set((draft: ImageLoaderState & ImageActions) => {
          draft.options.imgProxyDisabledUntil = now + 60 * 60 * 1000;
        });
        proxySuccessTimestamps.length = 0;
      }
    }

    // Raw processor
    function rawProcessQueue() {
      get().processQueue();
    }

    // Throttled version
    const throttledProcessQueue = throttle(rawProcessQueue, 200, { leading: true, trailing: true });

    function scheduleProcessQueue() {
      const { inFlightTasks } = get();
      if (inFlightTasks.size === 0) {
        rawProcessQueue();
      } else {
        throttledProcessQueue();
      }
    }

    return ({
      imageCache: new Map(),
      downloadQueues: {
        high: [],
        normal: [],
        low: []
      },
      inFlightTasks: new Set(),
      activeDownloadMeta: {},
      options: {
        maxConcurrentDownloads: 10,
        cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
        imgProxyEnabled: true,
        imgProxyDisabledUntil: 0,
        retryAttempts: 3,
        retryDelay: 1000,
        requestTimeout: 10000
      },
      stats: {
        fetched: {},
        loadingTimes: {},
      },
      permanentFailures: new Set(),
      temporaryFailures: new Map(),

      addToQueue: (
        url: string,
        reqWidth: number | "original",
        blurhash?: string,
        priority: ImagePriority = 'normal'
      ) => {
        set((draft: ImageLoaderState & ImageActions) => {
          const queue = draft.downloadQueues[priority];
          const cacheEntry = draft.imageCache.get(url);
          if (
            cacheEntry &&
            cacheEntry.variations.some((v: ImageVariation) =>
              v &&
              (v.reqWidth === 'original'
                ? true
                : reqWidth === 'original'
                  ? false
                  : v.reqWidth >= reqWidth)
            )
          ) {
            // Already cached with sufficient width, do not add to queue
            return;
          }
          // Find if the item already exists in the queue
          const existingIdx = queue.findIndex((q: ImageTask) => q.url === url && q.reqWidth === reqWidth);
          if (existingIdx !== -1) {
            // Increment refCount
            queue[existingIdx].refCount += 1;
          } else {
            // Add new item with refCount 1
            const item: ImageTask = { url, reqWidth, blurhash, refCount: 1 };
            console.log(`[ImageLoader] Queuing image: ${url} (width: ${reqWidth}, priority: ${priority})`);
            queue.push(item);
          }
        });
        scheduleProcessQueue();
      },

      processQueue: async () => {
        const { inFlightTasks, options, downloadQueues } = get() as ImageLoaderState & ImageActions;
        if (inFlightTasks.size >= options.maxConcurrentDownloads) {
          console.log(`[ImageLoader] Max concurrent downloads reached (${inFlightTasks.size}/${options.maxConcurrentDownloads}).`);
          return;
        }

        // Get highest priority item available
        const nextItem: ImageTask | undefined =
          downloadQueues.high[0] || downloadQueues.normal[0] || downloadQueues.low[0];
        if (!nextItem) {
          console.log('[ImageLoader] No images in queue to process.');
          return;
        }

        const key = queueItemKey(nextItem);

        // Remove from queue (regardless of refCount, since we're starting the download)
        set((draft: ImageLoaderState & ImageActions) => {
          let priority: ImagePriority = 'low';
          if (draft.downloadQueues.high.length && queueItemKey(draft.downloadQueues.high[0]) === key) priority = 'high';
          else if (draft.downloadQueues.normal.length && queueItemKey(draft.downloadQueues.normal[0]) === key) priority = 'normal';

          console.log(`[ImageLoader] Starting prefetch for: ${key} (priority: ${priority})`);
          draft.downloadQueues[priority] = draft.downloadQueues[priority].filter((q: ImageTask) => queueItemKey(q) !== key);
          draft.inFlightTasks.add(key);
          draft.activeDownloadMeta[key] = {
            startTime: Date.now(),
            timeoutMs: options.requestTimeout
          };
        });

        try {
          await (get() as ImageLoaderState & ImageActions).loadImage(nextItem);
        } finally {
          set((draft: ImageLoaderState & ImageActions) => {
            draft.inFlightTasks.delete(key);
            delete draft.activeDownloadMeta[key];
          });
          scheduleProcessQueue(); // Process next item
        }
      },

      loadImage: async (queueItem: ImageTask) => {
        const { options, imageCache, addToQueue, stats, permanentFailures, temporaryFailures } = get() as ImageLoaderState & ImageActions;
        const key = `${queueItem.url}|${queueItem.reqWidth}`;
        const timeoutMs = options.requestTimeout;

        // First check filesystem cache
        try {
          const cachePath = await Image.getCachePathAsync(key);
          if (cachePath) {
            console.log(`[ImageLoader] Found in filesystem cache: ${key}`);
            set((draft: ImageLoaderState & ImageActions) => {
              if (!draft.imageCache.has(key)) {
                draft.imageCache.set(key, {
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
              } else {
                // If already present, update variations
                const entry = draft.imageCache.get(key)!;
                entry.variations = entry.variations.filter((v: ImageVariation) => v.reqWidth !== queueItem.reqWidth);
                entry.variations.push({
                  reqWidth: queueItem.reqWidth,
                  source: { uri: cachePath },
                  status: 'loaded',
                  timestamp: Date.now(),
                  attempts: 1
                });
              }
            });
            return;
          }
        } catch (e) {
          console.warn(`[ImageLoader] Error checking filesystem cache for ${key}:`, e);
        }
        // Main image loading logic
        if (permanentFailures.has(queueItem.url)) {
          console.warn(`[ImageLoader] Skipping permanently failed URL: ${queueItem.url}`);
          return;
        }

        // --- New proxy + direct fallback with error capture ---
        const directUrl = queueItem.url;
        const now = Date.now();
        const proxyAllowed = options.imgProxyEnabled && now >= (options.imgProxyDisabledUntil || 0);
        const proxyUrl = proxyAllowed
          ? getProxiedImageUrl(directUrl, queueItem.reqWidth === 'original' ? Dimensions.get('window').width : queueItem.reqWidth)
          : directUrl;

        let loadedSource: ImageSource;
        try {
          // Try proxy (or direct if disabled)
          await Image.loadAsync({ uri: proxyUrl, cacheKey: key });
          loadedSource = { uri: proxyUrl };
        } catch (proxyErr) {
          // Proxy failed → try direct exactly once
          try {
            await Image.loadAsync({ uri: directUrl, cacheKey: key });
            loadedSource = { uri: directUrl };
            recordProxyFailureSuccess();
          } catch (directErr) {
            // Direct also failed → mark permanent failure and inject an error variation
            set((draft: ImageLoaderState & ImageActions) => {
              draft.permanentFailures.add(queueItem.url);
              let entry = draft.imageCache.get(queueItem.url);
              if (!entry) {
                entry = { blurhash: queueItem.blurhash, variations: [] };
                draft.imageCache.set(queueItem.url, entry);
              }
              entry.variations.push({
                reqWidth: queueItem.reqWidth,
                source: null,
                status: 'error',
                timestamp: Date.now(),
                attempts: 1
              });
            });
            return; // exit loadImage early, do not continue to success path
          }
        }

        set((draft: ImageLoaderState & ImageActions) => {
          let entry = draft.imageCache.get(queueItem.url);
          if (!entry) {
            entry = { blurhash: queueItem.blurhash, variations: [] };
            draft.imageCache.set(queueItem.url, entry);
          }
          // Remove any previous variation for this reqWidth
          entry.variations = entry.variations.filter((v: ImageVariation) => v.reqWidth !== queueItem.reqWidth);
          entry.variations.push({
            reqWidth: queueItem.reqWidth,
            source: loadedSource,
            status: 'loaded',
            timestamp: Date.now(),
            attempts: 1,
          });

          // Update session stats
          if (!draft.stats.fetched[queueItem.url]) draft.stats.fetched[queueItem.url] = 0;
          draft.stats.fetched[queueItem.url] += 1;
          if (!draft.stats.loadingTimes[queueItem.url]) draft.stats.loadingTimes[queueItem.url] = [];
          draft.stats.loadingTimes[queueItem.url].push(Date.now());
        });
      },

      clearCache: () => {
        set((draft) => {
          draft.imageCache = new Map();
          draft.stats = {
            fetched: {},
            loadingTimes: {},
          };
        });
      },

      updateConfig: (config: Partial<ImageLoaderOptions>) => {
        set((draft: ImageLoaderState & ImageActions) => {
          draft.options = { ...draft.options, ...config };
        });
      },

      removeFromQueue: (
        url: string,
        reqWidth: number | "original",
        priority?: ImagePriority
      ) => {
        set((draft: ImageLoaderState & ImageActions) => {
          const priorities: ImagePriority[] = priority ? [priority] : ['high', 'normal', 'low'];
          let removed = false;

          for (const p of priorities) {
            const queue = draft.downloadQueues[p];
            const idx = queue.findIndex((q: ImageTask) => q.url === url && q.reqWidth === reqWidth);
            if (idx !== -1) {
              const item = queue[idx];
              if (item.refCount > 1) {
                // Decrement refCount
                item.refCount -= 1;
                console.log(`[ImageLoader] Decremented refCount for image: ${url} (width: ${reqWidth}, priority: ${p}), new refCount: ${item.refCount}`);
              } else {
                // Remove item
                queue.splice(idx, 1);
                console.log(`[ImageLoader] Removed image from queue: ${url} (width: ${reqWidth}, priority: ${p})`);
              }
              removed = true;
              break; // Only remove from one queue
            }
          }

          if (!removed) {
            console.log(`[ImageLoader] Tried to remove image not found in queue: ${url} (width: ${reqWidth}, priority: ${priority ?? 'any'})`);
          }
        });
      }
    });
  })
);

export default useImageLoaderStore;
