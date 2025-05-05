import { Image, type ImageSource } from 'expo-image';
import { Dimensions } from 'react-native';
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
import { getProxiedImageUrl, isVariationSufficient } from './utils';

const HTTP_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 olas.app',
    Referer: 'https://olas.app/',
};

/**
 * Loads all cached image entries from the database and populates the in-memory imageCache.
 * Should be called once on app startup.
 */
export async function initializeImageCacheFromDb() {
    try {
        const entries = await getAllImageCacheEntries();
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
                },
                status: e.state,
                attempts: e.attempts,
            }));
            cache.set(originalUrl, { variations });
        }
        useImageLoaderStore.setState({ imageCache: cache });
    } catch (error) {
        console.error(`[ImageLoader] Error loading cache from DB: ${error}`);
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
        clearCache: () => void;
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
            for (const p of ['high', 'normal', 'low'] as ImagePriority[]) {
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

        retry: async (originalUrl, _reqWidth) => {
            const reqWidth = typeof _reqWidth === 'number' ? Math.round(_reqWidth) : _reqWidth;
            set((state) => ({
                imageCache: updateImageCache(state, originalUrl, (vars) =>
                    vars.filter((v) => v.reqWidth !== reqWidth)
                ),
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
            await get().loadImage({ originalUrl, reqWidth, refCount: 1 });
        },

        addToQueue: (originalUrl, _reqWidth, priority = 'normal') => {
            const reqWidth = typeof _reqWidth === 'number' ? Math.round(_reqWidth) : _reqWidth;
            set((state) => {
                const cacheEntry = state.imageCache.get(originalUrl);
                if (
                    cacheEntry &&
                    cacheEntry.variations.some((v) => isVariationSufficient(v, reqWidth))
                ) {
                    return {};
                }
                const queues = {
                    ...state.downloadQueues,
                    [priority]: [...state.downloadQueues[priority]],
                };
                const idx = queues[priority].findIndex(
                    (q) => q.originalUrl === originalUrl && q.reqWidth === reqWidth
                );
                if (idx >= 0) {
                    queues[priority][idx] = {
                        ...queues[priority][idx],
                        refCount: queues[priority][idx].refCount + 1,
                    };
                } else {
                    queues[priority].push({ originalUrl, reqWidth, refCount: 1 });
                }
                return { downloadQueues: queues };
            });
            scheduleProcessQueue();
        },

        processQueue: async () => {
            const { inFlightTasks, options, downloadQueues } = get();
            if (inFlightTasks.size >= options.maxConcurrentDownloads) return;
            const next =
                downloadQueues.high[0] || downloadQueues.normal[0] || downloadQueues.low[0];
            if (!next) return;
            const { originalUrl, reqWidth } = next;
            const id = `${originalUrl}|${reqWidth}`;
            set((state) => ({
                downloadQueues: cloneQueues(state.downloadQueues, { originalUrl, reqWidth }),
                inFlightTasks: new Set(state.inFlightTasks).add(id),
                activeDownloadMeta: {
                    ...state.activeDownloadMeta,
                    [id]: { startTime: Date.now(), timeoutMs: state.options.requestTimeout },
                },
            }));
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

        loadImage: async ({ originalUrl, reqWidth, refCount }) => {
            const loadStart = Date.now();
            const { options, permanentFailures } = get();
            if (permanentFailures.has(originalUrl)) {
                console.warn(`[ImageLoader] Skipping permanently failed URL: ${originalUrl}`);
                return;
            }
            const now = Date.now();
            const proxyAllowed =
                options.imgProxyEnabled && now >= (options.imgProxyDisabledUntil || 0);
            const proxiedUrl = proxyAllowed
                ? getProxiedImageUrl(
                      originalUrl,
                      reqWidth === 'original' ? Dimensions.get('window').width : reqWidth
                  ) || originalUrl
                : originalUrl;
            let fetchedUrl = proxiedUrl;
            let loadedSource: ImageSource | null = null;
            let loadSuccess = false;

            const start = Date.now();

            try {
                await Image.loadAsync(
                    { uri: proxiedUrl, headers: HTTP_HEADERS },
                    { onError: (err) => console.error(`Error loading via proxy:`, err) } as any
                );
                loadedSource = { uri: proxiedUrl };
                loadSuccess = true;
            } catch (proxyErr) {
                try {
                    console.log(
                        `[+${Date.now() - start}ms] Proxy failed, trying direct: ${originalUrl}`
                    );
                    await Image.loadAsync({
                        uri: originalUrl,
                        cacheKey: directKey,
                        headers: HTTP_HEADERS,
                    });
                    loadedSource = { uri: originalUrl, cacheKey: directKey };
                    fetchedUrl = originalUrl;
                    recordProxyFailureSuccess();
                    loadSuccess = true;
                } catch (directErr) {
                    console.error(
                        `[+${Date.now() - start}ms] Direct load failed: ${originalUrl}`,
                        directErr
                    );
                    set((state) => ({
                        permanentFailures: new Set(state.permanentFailures).add(originalUrl),
                        imageCache: updateImageCache(state, originalUrl, (vars) => [
                            ...vars,
                            { reqWidth, source: null, status: 'error', attempts: 1 },
                        ]),
                    }));
                    await markImageCacheFailure(
                        originalUrl,
                        reqWidth === 'original' ? null : reqWidth,
                        'error',
                        directKey
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
                                Date.now() - loadStart,
                            ],
                        },
                    },
                }));
                await upsertImageCacheEntry({
                    originalUrl,
                    width: reqWidth === 'original' ? null : reqWidth,
                    state: 'loaded',
                    fetchedUrl,
                    attempts: 1,
                });
            }
        },

        clearCache: () => {
            set(() => ({
                imageCache: new Map(),
                downloadQueues: { high: [], normal: [], low: [] },
                inFlightTasks: new Set(),
                activeDownloadMeta: {},
                stats: { fetched: {}, loadingTimes: {} },
                permanentFailures: new Set(),
            }));
        },

        updateConfig: (config) => {
            set((state) => ({ options: { ...state.options, ...config } }));
        },

        removeFromQueue: (originalUrl, _reqWidth, priority = 'normal') => {
            const reqWidth = typeof _reqWidth === 'number' ? Math.round(_reqWidth) : _reqWidth;
            set((state) => ({
                downloadQueues: {
                    ...state.downloadQueues,
                    [priority]: state.downloadQueues[priority].filter(
                        (q) => q.originalUrl !== originalUrl || q.reqWidth !== reqWidth
                    ),
                },
            }));
        },
    };
});

initializeImageCacheFromDb();

export default useImageLoaderStore;
