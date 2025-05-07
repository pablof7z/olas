import { Image, type ImageSource } from 'expo-image';
import { create } from 'zustand';
import { getAllImageCacheEntries, markImageCacheFailure, upsertImageCacheEntry } from './db';
import type { DbImageCacheEntry } from './types';
import type {
    ImageLoaderOptions,
    ImageLoaderState,
    ImagePriority,
    ImageTask,
    ImageVariation,
} from './types';
import { generateFilesystemKey, getProxiedImageUrl, isVariationSufficient } from './utils';

const HTTP_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Referer: 'https://olas.app/',
};

const t0 = Date.now();

/**
 * Loads all cached image entries from the database and populates the in-memory imageCache.
 * Should be called once on app startup.
 */
export function initializeImageCacheFromDb() {
    try {
        const entries = getAllImageCacheEntries();
        const grouped = new Map<string, DbImageCacheEntry[]>();
        for (const entry of entries) {
            (
                grouped.get(entry.originalUrl) ??
                grouped.set(entry.originalUrl, []).get(entry.originalUrl)!
            ).push(entry);
        }
        const cache = new Map<string, { variations: ImageVariation[] }>();
        for (const [originalUrl, dbEntries] of grouped) {
            const variations = dbEntries.map((e) => ({
                reqWidth: e.width === null ? ('original' as const) : e.width,
                source: {
                    uri: e.fetchedUrl || e.originalUrl,
                    cacheKey: e.cacheKey,
                },
                status: e.state,
                attempts: e.attempts,
            }));
            cache.set(originalUrl, { variations });
        }
        useImageLoaderStore.setState({ imageCache: cache });
    } catch (error) {
        console.error(
            `[+${Date.now() - t0}ms] [ImageLoader] Error loading cache from DB: ${error}`
        );
    }
}

const proxySuccessTimestamps: number[] = [];

const useImageLoaderStore = create<
    ImageLoaderState & {
        addToQueue: (
            originalUrl: string,
            reqWidth: number | 'original',
            priority?: ImagePriority
        ) => void;
        processQueue: () => Promise<void>;
        loadImage: (task: ImageTask) => Promise<void>;
        updateConfig: (config: Partial<ImageLoaderOptions>) => void;
        removeFromQueue: (
            originalUrl: string,
            reqWidth: number | 'original',
            priority?: ImagePriority
        ) => void;
        retry: (originalUrl: string, reqWidth: number | 'original') => Promise<void>;
    }
>((set, get) => {
    // Helpers
    const updateImageCache = (
        state: ImageLoaderState,
        url: string,
        transform: (vars: ImageVariation[]) => ImageVariation[]
    ) => {
        const cache = new Map(state.imageCache);
        const existing = cache.get(url);
        const newVars = transform(existing?.variations ?? []);
        if (newVars.length) cache.set(url, { variations: newVars });
        else cache.delete(url);
        return cache;
    };
    const cloneQueues = (
        queues: ImageLoaderState['downloadQueues'],
        remove?: { originalUrl: string; reqWidth: number | 'original' }
    ) => {
        const newQ = {
            high: [...queues.high],
            normal: [...queues.normal],
            low: [...queues.low],
        };
        if (remove) {
            for (const p of ['high', 'normal', 'low'] as const) {
                newQ[p] = newQ[p].filter(
                    (q) => q.originalUrl !== remove.originalUrl || q.reqWidth !== remove.reqWidth
                );
            }
        }
        return newQ;
    };
    const recordProxyFailureSuccess = () => {
        const now = Date.now();
        while (proxySuccessTimestamps.length && proxySuccessTimestamps[0] < now - 5 * 60 * 1000) {
            proxySuccessTimestamps.shift();
        }
        proxySuccessTimestamps.push(now);
        if (proxySuccessTimestamps.length >= 3) {
            set((state) => ({
                options: { ...state.options, imgProxyDisabledUntil: now + 60 * 60 * 1000 },
            }));
            proxySuccessTimestamps.length = 0;
        }
    };
    const scheduleProcessQueue = () => {
        const { inFlightTasks, options, downloadQueues } = get();
        let slots = options.maxConcurrentDownloads - inFlightTasks.size;
        while (
            slots > 0 &&
            downloadQueues.high.length + downloadQueues.normal.length + downloadQueues.low.length >
                0
        ) {
            get().processQueue();
            slots--;
        }
    };

    return {
        imageCache: new Map(),
        downloadQueues: { high: [], normal: [], low: [] },
        inFlightTasks: new Set(),
        activeDownloadMeta: {},
        options: {
            maxConcurrentDownloads: 5,
            cacheTimeout: 24 * 60 * 60 * 1000,
            imgProxyEnabled: false,
            imgProxyDisabledUntil: 0,
            retryAttempts: 3,
            retryDelay: 1000,
            requestTimeout: 10000,
        },
        stats: { fetched: {}, loadingTimes: {} },
        permanentFailures: new Set(),
        loadingFailures: [],

        retry: async (originalUrl, _reqWidth) => {
            const reqWidth = typeof _reqWidth === 'number' ? Math.round(_reqWidth) : _reqWidth;
            set((state) => ({
                imageCache: updateImageCache(state, originalUrl, (vars) => {
                    // Remove any previous variation for this reqWidth, then add a new one with status 'loading'
                    const filtered = vars.filter((v) => v.reqWidth !== reqWidth);
                    return [
                        ...filtered,
                        {
                            reqWidth,
                            source: null,
                            status: 'loading',
                            attempts: 0,
                        },
                    ];
                }),
                permanentFailures: (() => {
                    const s = new Set(state.permanentFailures);
                    s.delete(originalUrl);
                    return s;
                })(),
                inFlightTasks: (() => {
                    const s = new Set(state.inFlightTasks);
                    s.delete(`${originalUrl}|${reqWidth}`);
                    return s;
                })(),
                activeDownloadMeta: (() => {
                    const m = { ...state.activeDownloadMeta };
                    delete m[`${originalUrl}|${reqWidth}`];
                    return m;
                })(),
                downloadQueues: cloneQueues(state.downloadQueues, { originalUrl, reqWidth }),
            }));
            // Add the retried item to the front of the high priority queue
            set((state) => {
                const highQueue = [...state.downloadQueues.high];
                // Remove any existing instance of this task in the high queue
                const filteredQueue = highQueue.filter(
                    (q) => !(q.originalUrl === originalUrl && q.reqWidth === reqWidth)
                );
                filteredQueue.unshift({ originalUrl, reqWidth, refCount: 1 });
                return {
                    downloadQueues: {
                        ...state.downloadQueues,
                        high: filteredQueue,
                    },
                };
            });
            // Immediately process the queue to work on the retried item
            await get().processQueue();
        },

        addToQueue: (originalUrl, _reqWidth, priority = 'normal') => {
            const reqWidth = typeof _reqWidth === 'number' ? Math.round(_reqWidth) : _reqWidth;
            // Map "highest" to "high" for queueing
            const queueKey: 'high' | 'normal' | 'low' = priority === 'highest' ? 'high' : priority;
            set((state) => {
                const cacheEntry = state.imageCache.get(originalUrl);
                // If already loaded or loading, do nothing
                if (cacheEntry?.variations.some((v) => isVariationSufficient(v, reqWidth))) {
                    return {};
                }
                const queues = {
                    ...state.downloadQueues,
                    [queueKey]: [...state.downloadQueues[queueKey]],
                };
                const idx = queues[queueKey].findIndex(
                    (q) => q.originalUrl === originalUrl && q.reqWidth === reqWidth
                );
                if (idx >= 0) {
                    queues[queueKey][idx] = {
                        ...queues[queueKey][idx],
                        refCount: queues[queueKey][idx].refCount + 1,
                    };
                } else {
                    queues[queueKey].push({ originalUrl, reqWidth, refCount: 1 });
                }

                // Add or update the cache entry to "queued" if not present
                const imageCache = new Map(state.imageCache);
                const entry = imageCache.get(originalUrl);
                if (!entry || !entry.variations.some((v) => v.reqWidth === reqWidth)) {
                    const newVariation: ImageVariation = {
                        reqWidth,
                        source: null,
                        status: 'queued',
                        attempts: 0,
                    };
                    if (entry) {
                        imageCache.set(originalUrl, {
                            variations: [...entry.variations, newVariation],
                        });
                    } else {
                        imageCache.set(originalUrl, {
                            variations: [newVariation],
                        });
                    }
                }
                return { downloadQueues: queues, imageCache };
            });
            if (priority === 'highest') {
                get().processQueue();
            } else {
                scheduleProcessQueue();
            }
        },

        processQueue: async () => {
            const { inFlightTasks, options, downloadQueues } = get();
            if (inFlightTasks.size >= options.maxConcurrentDownloads) return;
            const next =
                downloadQueues.high[0] || downloadQueues.normal[0] || downloadQueues.low[0];
            if (!next) return;
            const { originalUrl, reqWidth } = next;
            const id = `${originalUrl}|${reqWidth}`;
            set((state) => {
                // Update the cache entry to "loading" when starting to process
                const imageCache = new Map(state.imageCache);
                const entry = imageCache.get(originalUrl);
                if (entry) {
                    imageCache.set(originalUrl, {
                        variations: entry.variations.map((v) =>
                            v.reqWidth === reqWidth ? { ...v, status: 'loading' } : v
                        ),
                    });
                }
                return {
                    downloadQueues: cloneQueues(state.downloadQueues, { originalUrl, reqWidth }),
                    inFlightTasks: new Set(state.inFlightTasks).add(id),
                    activeDownloadMeta: {
                        ...state.activeDownloadMeta,
                        [id]: { startTime: Date.now(), timeoutMs: state.options.requestTimeout },
                    },
                    imageCache,
                };
            });
            try {
                await get().loadImage(next);
            } finally {
                set((state) => {
                    const tasks = new Set(state.inFlightTasks);
                    tasks.delete(id);
                    const meta = { ...state.activeDownloadMeta };
                    delete meta[id];
                    return { inFlightTasks: tasks, activeDownloadMeta: meta };
                });
                scheduleProcessQueue();
            }
        },

        loadImage: async ({ originalUrl, reqWidth }) => {
            const loadImageStart = Date.now();

            const loadImageReal = async (fetchUrl: string) => {
                const cacheKey = generateFilesystemKey(originalUrl);
                const res = await Image.loadAsync(
                    { uri: fetchUrl, headers: HTTP_HEADERS, cacheKey },
                    {
                        onError: (err: unknown) =>
                            console.error(`[+${Date.now() - t0}ms] Error loading via proxy:`, err),
                    } as any
                );
                return { uri: fetchUrl, cacheKey };
            };

            const { options } = get();
            const proxyAllowed = shouldUseProxy(options, reqWidth);
            let loadedSource: ImageSource | null = null;
            let loadSuccess = false;

            if (proxyAllowed) {
                const proxiedUrl = getProxiedImageUrl(originalUrl, reqWidth as number);
                try {
                    loadedSource = await loadImageReal(proxiedUrl);
                    loadSuccess = true;
                } catch (proxyErr) {
                    console.error(
                        `[+${Date.now() - t0}ms] [+${Date.now() - loadImageStart}ms] Proxy load failed: ${proxiedUrl} [${originalUrl}]`,
                        proxyErr
                    );
                }
            }

            if (!loadSuccess) {
                try {
                    loadedSource = await loadImageReal(originalUrl);
                    loadSuccess = true;
                    recordProxyFailureSuccess();
                } catch (err) {
                    console.error(
                        `[+${Date.now() - t0}ms] [+${Date.now() - loadImageStart}ms] Direct load failed: ${originalUrl}`,
                        err
                    );
                    set((state) => ({
                        imageCache: updateImageCache(state, originalUrl, (vars) =>
                            vars
                                // drop any old entry at this width
                                .filter((v) => v.reqWidth !== reqWidth)
                                // now add exactly one error entry
                                .concat({
                                    reqWidth,
                                    source: null,
                                    status: 'error',
                                    attempts:
                                        (vars.find((v) => v.reqWidth === reqWidth)?.attempts ?? 0) +
                                        1,
                                })
                        ),
                        permanentFailures: new Set(state.permanentFailures).add(originalUrl),
                    }));
                    await markImageCacheFailure(
                        originalUrl,
                        reqWidth === 'original' ? null : reqWidth,
                        'error',
                        2
                    );
                    return;
                }
            }

            if (loadSuccess && loadedSource) {
                set((state) => ({
                    imageCache: updateImageCache(state, originalUrl, (vars) =>
                        vars
                            .filter((v) => v.reqWidth !== reqWidth)
                            .concat({
                                reqWidth,
                                source: loadedSource,
                                status: 'loaded',
                                attempts: 1,
                            })
                    ),
                    stats: {
                        fetched: {
                            ...state.stats.fetched,
                            [originalUrl]: (state.stats.fetched[originalUrl] ?? 0) + 1,
                        },
                        loadingTimes: {
                            ...state.stats.loadingTimes,
                            [originalUrl]: [
                                ...(state.stats.loadingTimes[originalUrl] ?? []),
                                Date.now() - loadImageStart,
                            ],
                        },
                    },
                }));

                if (!loadedSource.cacheKey) {
                    console.error("[ImageLoader] Loaded image without cacheKey:", originalUrl);
                } else {
                    upsertImageCacheEntry({
                        originalUrl,
                        width: reqWidth === 'original' ? null : reqWidth,
                        state: 'loaded',
                        fetchedUrl: loadedSource.uri!,
                        attempts: 1,
                        cacheKey: loadedSource.cacheKey,
                    });
                }
            }
        },

        updateConfig: (config) => {
            set((state) => ({ options: { ...state.options, ...config } }));
        },

        removeFromQueue: (originalUrl, _reqWidth, priority = 'normal') => {
            const reqWidth = typeof _reqWidth === 'number' ? Math.round(_reqWidth) : _reqWidth;
            set((state) => ({
                downloadQueues: {
                    ...state.downloadQueues,
                    [priority === 'highest' ? 'high' : priority]: state.downloadQueues[
                        priority === 'highest' ? 'high' : priority
                    ].filter((q) => q.originalUrl !== originalUrl || q.reqWidth !== reqWidth),
                },
            }));
        },
    };
});

initializeImageCacheFromDb();

function shouldUseProxy(options: ImageLoaderOptions, reqWidth: number | 'original') {
    if (
        !options.imgProxyEnabled ||
        (options.imgProxyDisabledUntil && options.imgProxyDisabledUntil > Date.now()) ||
        reqWidth === 'original'
    )
        return false;
    return true;
}

export default useImageLoaderStore;
