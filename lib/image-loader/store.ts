import {
  upsertImageCacheEntry,
  markImageCacheFailure,
  getAllImageCacheEntries
} from './db';
import type { DbImageCacheEntry } from './types';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Dimensions } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import type {
  ImagePriority, ImageLoaderOptions,
  ImageVariation,
  ImageTask,
  ImageLoaderState
} from './types';
import { getProxiedImageUrl, isVariationSufficient, generateFilesystemKey } from './utils';
// --- Image cache initialization from DB ---

/**
 * Loads all cached image entries from the database and populates the in-memory imageCache.
 * Should be called once on app startup.
 */
export async function initializeImageCacheFromDb() {
  const start = Date.now();
  try {
    // Get entries with proper error handling
    const entries = await getAllImageCacheEntries();
    
    // Group by originalUrl
    const grouped = new Map();
    for (const entry of entries) {
      const key = entry.originalUrl;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(entry);
    }
    
    // Convert to store format
    const cache = new Map();
    for (const [originalUrl, dbEntries] of grouped.entries()) {
      const variations = dbEntries.map((dbEntry: DbImageCacheEntry) => ({
        reqWidth: dbEntry.width === null ? 'original' : dbEntry.width,
        source: {
          uri: dbEntry.fetchedUrl || dbEntry.originalUrl,
          cacheKey: dbEntry.filesystemKey,
        },
        status: dbEntry.state,
        attempts: dbEntry.attempts,
      }));
      cache.set(originalUrl, { variations });
    }
    
    // Update the Zustand store atomically
    useImageLoaderStore.setState((state) => {
      state.imageCache = cache;
    });
  } catch (error) {
    console.error(`[ImageLoader] Error loading image cache from DB: ${error}`);
    return;
  }
}

// In-memory array to track proxy fallback successes
const proxySuccessTimestamps: number[] = [];

interface ImageActions {
  addToQueue: (originalUrl: string, reqWidth: number | "original", priority?: ImagePriority) => void;
  processQueue: () => Promise<void>;
  loadImage: (image: ImageTask) => Promise<void>;
  clearCache: () => void;
  updateConfig: (config: Partial<ImageLoaderOptions>) => void;
  removeFromQueue: (originalUrl: string, reqWidth: number | "original", priority?: ImagePriority) => void;
  retry: (
    originalUrl: string,
    reqWidth: number | "original",
  ) => void;
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

    function scheduleProcessQueue() {
      const { inFlightTasks, options, downloadQueues } = get();
      // Keep starting downloads while there's queue items and free slots
      const totalQueued = downloadQueues.high.length + downloadQueues.normal.length + downloadQueues.low.length;
      let slots = options.maxConcurrentDownloads - inFlightTasks.size;
      while (slots > 0 && totalQueued > 0) {
        rawProcessQueue();
        slots--;
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

      retry: (
        originalUrl: string,
        reqWidth: number | "original",
      ) => {
        set((draft: ImageLoaderState & ImageActions) => {
          // Remove the relevant variation from imageCache
          const cacheEntry = draft.imageCache.get(originalUrl);
          if (cacheEntry) {
            cacheEntry.variations = cacheEntry.variations.filter(
              (v: ImageVariation) => v.reqWidth !== reqWidth
            );
            // If no variations left, remove the cache entry entirely
            if (cacheEntry.variations.length === 0) {
              draft.imageCache.delete(originalUrl);
            }
          }

          // Remove from permanentFailures
          draft.permanentFailures.delete(originalUrl);

          // Remove any in-flight task for this image/variation
          const id = `${originalUrl}|${reqWidth}`;
          draft.inFlightTasks.delete(id);
          delete draft.activeDownloadMeta[id];

          // Remove from all download queues (in case it's queued in multiple)
          (['high', 'normal', 'low'] as ImagePriority[]).forEach((p: ImagePriority) => {
            draft.downloadQueues[p] = draft.downloadQueues[p].filter(
              (q: ImageTask) => !(q.originalUrl === originalUrl && q.reqWidth === reqWidth)
            );
          });
        });
        get().loadImage({ originalUrl, reqWidth, refCount: 1 });
      },

      addToQueue: (
        originalUrl: string,
        reqWidth: number | "original",
        priority: ImagePriority = 'normal'
      ) => {
        set((draft: ImageLoaderState & ImageActions) => {
          const queue = draft.downloadQueues[priority];
          const cacheEntry = draft.imageCache.get(originalUrl);
          const alreadyCached = cacheEntry && cacheEntry.variations.some((v: ImageVariation) => isVariationSufficient(v, reqWidth));
          if (alreadyCached) return;
      
          // Find if the item already exists in the queue
          const existingIdx = queue.findIndex((q: ImageTask) =>
            q.originalUrl === originalUrl && q.reqWidth === reqWidth
          );
          if (existingIdx !== -1) {
            // Increment refCount
            queue[existingIdx].refCount += 1;
          } else {
            // Add new item with refCount 1
            const item: ImageTask = { originalUrl, reqWidth, refCount: 1 };
            queue.push(item);
          }
        });
        scheduleProcessQueue();
      },

      processQueue: async () => {
        const { inFlightTasks, options, downloadQueues } = get() as ImageLoaderState & ImageActions;
        if (inFlightTasks.size >= options.maxConcurrentDownloads) {
          return;
        }

        // Get highest priority item available
        const nextItem: ImageTask | undefined =
          downloadQueues.high[0] || downloadQueues.normal[0] || downloadQueues.low[0];
        if (!nextItem) return;

        // Use url+reqWidth as unique identifier for queue/inFlight
        const { originalUrl, reqWidth } = nextItem;
        const id = `${originalUrl}|${reqWidth}`;

        // Remove from queue (regardless of refCount, since we're starting the download)
        set((draft: ImageLoaderState & ImageActions) => {
          let priority: ImagePriority = 'low';
          if (draft.downloadQueues.high.length && draft.downloadQueues.high[0].originalUrl === originalUrl && draft.downloadQueues.high[0].reqWidth === reqWidth) priority = 'high';
          else if (draft.downloadQueues.normal.length && draft.downloadQueues.normal[0].originalUrl === originalUrl && draft.downloadQueues.normal[0].reqWidth === reqWidth) priority = 'normal';

          draft.downloadQueues[priority] = draft.downloadQueues[priority].filter((q: ImageTask) => !(q.originalUrl === originalUrl && q.reqWidth === reqWidth));
          draft.inFlightTasks.add(id);
          draft.activeDownloadMeta[id] = {
            startTime: Date.now(),
            timeoutMs: options.requestTimeout
          };
        });

        try {
          await (get() as ImageLoaderState & ImageActions).loadImage(nextItem);
        } finally {
          set((draft: ImageLoaderState & ImageActions) => {
            draft.inFlightTasks.delete(id);
            delete draft.activeDownloadMeta[id];
          });
          scheduleProcessQueue(); // Process next item
        }
      },

      loadImage: async (queueItem: ImageTask) => {
        const loadStart = Date.now();
        const { options, imageCache, addToQueue, stats, permanentFailures } = get() as ImageLoaderState & ImageActions;
        const originalUrl = queueItem.originalUrl;
        const reqWidth = queueItem.reqWidth;
        const timeoutMs = options.requestTimeout;


        if (permanentFailures.has(originalUrl)) {
          console.warn(`[ImageLoader] Skipping permanently failed URL: ${originalUrl}`);
          return;
        }
        
        const now = Date.now();
        const proxyAllowed = options.imgProxyEnabled && now >= (options.imgProxyDisabledUntil || 0);
        const proxiedUrl = proxyAllowed
          ? getProxiedImageUrl(originalUrl, reqWidth === 'original' ? Dimensions.get('window').width : reqWidth)
          : originalUrl;
        
        let fetchedUrl = proxiedUrl;
        let filesystemKey = generateFilesystemKey();
        let loadedSource: ImageSource | null = null;
        let loadSuccess = false;

        const start = Date.now();
        
        try {
          console.log(`\t[ImageLoader +${Date.now() - start}] Loading image: ${originalUrl} (width: ${reqWidth}, proxy: ${proxiedUrl})`);
          await Image.loadAsync({ uri: proxiedUrl, cacheKey: filesystemKey }, { onError: (err) => {
            console.error(`\t[ImageLoader +${Date.now() - start}] Image.loadAsync reported an error loading image: ${originalUrl} (width: ${reqWidth}, proxy: ${proxiedUrl})`, err);
          }});
          loadedSource = { uri: proxiedUrl, cacheKey: filesystemKey };
          fetchedUrl = proxiedUrl;
          loadSuccess = true;
        } catch (proxyErr) {
          // Proxy failed → try direct exactly once
          try {
            console.log(`\t[ImageLoader +${Date.now() - start}] Proxy failed, trying direct load: ${originalUrl} (width: ${reqWidth})`, proxyErr);
            await Image.loadAsync({ uri: originalUrl, cacheKey: filesystemKey });
            console.log(`\t[ImageLoader +${Date.now() - start}] Direct load succeeded: ${originalUrl} (width: ${reqWidth})`);
            loadedSource = { uri: originalUrl, cacheKey: filesystemKey };
            fetchedUrl = originalUrl;
            recordProxyFailureSuccess();
            loadSuccess = true;
          } catch (directErr) {
            console.error(`\t[ImageLoader +${Date.now() - start}] Direct load failed: ${originalUrl} (width: ${reqWidth})`, directErr);
            set((draft: ImageLoaderState & ImageActions) => {
              draft.permanentFailures.add(originalUrl);
              let entry = draft.imageCache.get(originalUrl);
              if (!entry) {
                entry = { variations: [] };
                draft.imageCache.set(originalUrl, entry);
              }
              // Type extension: fetchedUrl and filesystemKey are not in ImageVariation type, but required by new logic
              entry.variations.push({
                reqWidth,
                source: null,
                status: 'error',
                attempts: 1,
              });
            });
            await markImageCacheFailure(
              originalUrl,
              reqWidth === 'original' ? null : reqWidth,
              filesystemKey
            );
            return;
          }
        }

        if (loadSuccess && loadedSource) {
          set((draft: ImageLoaderState & ImageActions) => {
            let entry = draft.imageCache.get(originalUrl);
            if (!entry) {
              entry = { variations: [] };
              draft.imageCache.set(originalUrl, entry);
            }
            // Remove any previous variation for this reqWidth
            entry.variations = entry.variations.filter((v: ImageVariation) => v.reqWidth !== reqWidth);
            
            entry.variations.push({
              reqWidth,
              source: { uri: fetchedUrl, cacheKey: filesystemKey },
              status: 'loaded',
              attempts: 1,
            });
        
            // Update session stats
            if (!draft.stats.fetched[originalUrl]) draft.stats.fetched[originalUrl] = 0;
            draft.stats.fetched[originalUrl] += 1;
            if (!draft.stats.loadingTimes[originalUrl]) draft.stats.loadingTimes[originalUrl] = [];
            draft.stats.loadingTimes[originalUrl].push(Date.now() - loadStart);
          });
        
          // Persist successful load to DB
          await upsertImageCacheEntry({originalUrl,
            width: reqWidth === 'original' ? null : reqWidth,
            state: 'loaded',
            filesystemKey,
            fetchedUrl,
            attempts: 1});
        }
      },

      clearCache: () => {
        set((draft) => {
          draft.imageCache.clear();
          draft.downloadQueues.high = [];
          draft.downloadQueues.normal = [];
          draft.downloadQueues.low = [];
          draft.inFlightTasks.clear();
          draft.activeDownloadMeta = {};
          draft.stats.fetched = {};
          draft.stats.loadingTimes = {};
          draft.permanentFailures.clear();
        });
      },

      updateConfig: (config: Partial<ImageLoaderOptions>) => {
        set((draft: ImageLoaderState & ImageActions) => {
          draft.options = { ...draft.options, ...config };
        });
      },

      removeFromQueue: (originalUrl: string, reqWidth: number | "original", priority: ImagePriority = 'normal') => {
        set((draft: ImageLoaderState & ImageActions) => {
          draft.downloadQueues[priority] = draft.downloadQueues[priority].filter(
            (q: ImageTask) => !(q.originalUrl === originalUrl && q.reqWidth === reqWidth)
          );
        });
      }
    });
  }
)
);

// Call the initialization immediately after store creation
initializeImageCacheFromDb();

export default useImageLoaderStore;
