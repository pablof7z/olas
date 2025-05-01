import { enableMapSet } from 'immer';
enableMapSet();

import { act } from 'react-test-renderer';

// --- Global Mocks ---
jest.mock('react-native', () => ({
  Dimensions: { get: () => ({ width: 200, height: 100 }) },
}));
jest.mock('expo-image', () => ({
  Image: {
    loadAsync: jest.fn(),
    getCachePathAsync: jest.fn(),
  },
  ImageSource: {},
}));
jest.mock('../../../lib/image-loader/utils', () => ({
  getProxiedImageUrl: jest.fn((url: string) => `proxy://${url}`),
  throttle: (fn: any) => fn,
}));

import useImageLoaderStore from '../../../lib/image-loader/store';
import { ImageLoaderState, ImageVariation, ImagePriority, ImageTask } from '../../../lib/image-loader/types';
import { Image } from 'expo-image';
import { getProxiedImageUrl } from '../../../lib/image-loader/utils';

const flushPromises = () => new Promise(resolve => process.nextTick(resolve));

describe('image-loader store', () => {
  // Helper to reset Zustand store and in-memory singletons
  const resetStore = () => {
    useImageLoaderStore.setState(useImageLoaderStore.getState(), true);
    useImageLoaderStore.setState((state: ImageLoaderState) => {
      state.options.imgProxyDisabledUntil = undefined;
    });
    // @ts-ignore
    if (global.proxySuccessTimestamps) global.proxySuccessTimestamps.length = 0;
  };

  beforeEach(() => {
    resetStore();
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('has correct initial state', () => {
    const state = useImageLoaderStore.getState();
    expect(state.imageCache.size).toBe(0);
    expect(state.downloadQueues.high).toEqual([]);
    expect(state.downloadQueues.normal).toEqual([]);
    expect(state.downloadQueues.low).toEqual([]);
    expect(state.inFlightTasks.size).toBe(0);
    expect(state.options.maxConcurrentDownloads).toBe(10);
    expect(state.stats.fetched).toEqual({});
    expect(state.stats.loadingTimes).toEqual({});
    expect(state.permanentFailures.size).toBe(0);
    // temporaryFailures is not present in the store state
  });

  // --- 2. addToQueue ---
  it('addToQueue: enqueues new task, increments refCount, respects priority', () => {
    const store = useImageLoaderStore.getState();
    const url = 'https://img/1.png';

    // Mock processQueue at the store module level to prevent auto-processing
    const originalProcessQueue = useImageLoaderStore.getState().processQueue;
    useImageLoaderStore.setState((s: typeof store) => {
      s.processQueue = jest.fn();
    });

    // Add normal priority
    act(() => {
      store.addToQueue(url, 100);
    });
    let normalQueue = useImageLoaderStore.getState().downloadQueues.normal;
    expect(normalQueue.length).toBe(1);
    expect(normalQueue[0].originalUrl).toBe(url);
    expect(normalQueue[0].refCount).toBe(1);

    // Add same task again
    act(() => {
      store.addToQueue(url, 100);
    });
    normalQueue = useImageLoaderStore.getState().downloadQueues.normal;
    expect(normalQueue.length).toBe(1);
    expect(normalQueue[0].refCount).toBe(2);

    // Add high priority
    act(() => {
      store.addToQueue(url, 200, 'high');
    });
    const highQueue = useImageLoaderStore.getState().downloadQueues.high;
    expect(highQueue.length).toBe(1);
    expect(highQueue[0].originalUrl).toBe(url);
    expect(highQueue[0].reqWidth).toBe(200);

    // Add low priority
    act(() => {
      store.addToQueue(url, 300, 'low');
    });
    const lowQueue = useImageLoaderStore.getState().downloadQueues.low;
    expect(lowQueue.length).toBe(1);
    expect(lowQueue[0].originalUrl).toBe(url);
    expect(lowQueue[0].reqWidth).toBe(300);

    // Restore original processQueue
    useImageLoaderStore.setState((s: typeof store) => {
      s.processQueue = originalProcessQueue;
    });
  });

  // --- 3. scheduleProcessQueue & processQueue ---
  it('processQueue: processes tasks, respects concurrency, updates inFlightTasks and activeDownloadMeta', async () => {
    const store = useImageLoaderStore.getState();
    // Save original loadImage
    const originalLoadImage = store.loadImage;
    const loadImageMock = jest.fn<Promise<void>, [any]>().mockResolvedValue(undefined);
    useImageLoaderStore.setState((s: typeof store) => {
      s.loadImage = loadImageMock;
    });

    act(() => {
      store.addToQueue('url1', 100);
      store.addToQueue('url2', 100);
      store.addToQueue('url3', 100);
    });

    await act(async () => {
      await store.processQueue();
      await flushPromises();
    });

    const state = useImageLoaderStore.getState();
    expect(loadImageMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(state.inFlightTasks.size).toBeLessThanOrEqual(state.options.maxConcurrentDownloads);
    expect(state.downloadQueues.normal.length).toBe(0);

    // Restore original loadImage
    useImageLoaderStore.setState((s: typeof store) => {
      s.loadImage = originalLoadImage;
    });
  });

  it('processQueue: enforces maxConcurrentDownloads', async () => {
    const store = useImageLoaderStore.getState();
    act(() => {
      store.updateConfig({ maxConcurrentDownloads: 2 });
    });

    // Save original loadImage
    const originalLoadImage = store.loadImage;
    const loadImageMock = jest.fn<Promise<void>, [any]>(() => new Promise<void>(() => {}));
    useImageLoaderStore.setState((s: typeof store) => {
      s.loadImage = loadImageMock;
    });

    act(() => {
      store.addToQueue('url1', 100);
      store.addToQueue('url2', 100);
      store.addToQueue('url3', 100);
      store.addToQueue('url4', 100);
    });

    await act(async () => {
      await store.processQueue();
    });

    const state = useImageLoaderStore.getState();
    expect(state.inFlightTasks.size).toBe(2);
    expect(loadImageMock).toHaveBeenCalledTimes(2);

    // Restore original loadImage
    useImageLoaderStore.setState((s: typeof store) => {
      s.loadImage = originalLoadImage;
    });
  });

  // --- 4. Proxy→direct fallback ---
  it('loadImage: falls back from proxy to direct, disables proxy after 3 successes', async () => {
    const store = useImageLoaderStore.getState();
    const url = 'img/fallback.png';

    // Ensure proxy is enabled
    useImageLoaderStore.setState((state: ImageLoaderState) => {
      state.options.imgProxyEnabled = true;
      state.options.imgProxyDisabledUntil = 0;
    });

    // Mock Image.loadAsync: fail on proxy, succeed on direct
    (Image.loadAsync as jest.Mock)
      .mockImplementationOnce((src) => {
        // eslint-disable-next-line no-console
        console.log('Image.loadAsync called with:', src);
        return Promise.reject(new Error('proxy fail'));
      })
      .mockImplementationOnce((src) => {
        // eslint-disable-next-line no-console
        console.log('Image.loadAsync called with:', src);
        return Promise.resolve({ uri: url });
      });

    // First call: should fallback to direct
    await act(async () => {
      await store.loadImage({ originalUrl: url, reqWidth: 100, refCount: 1 });
      await flushPromises();
    });

    // Check imageCache has direct URI
    const cacheEntry = useImageLoaderStore.getState().imageCache.get(url);
    // Debug output for diagnosis
    // eslint-disable-next-line no-console
    console.log('cacheEntry:', cacheEntry);
    expect(cacheEntry).toBeDefined();
    const variation = cacheEntry?.variations.find((v: ImageVariation) => v.reqWidth === 100);
    // eslint-disable-next-line no-console
    console.log('variation:', variation);
    expect(variation?.status).toBe('loaded');
    expect((variation?.source as any)?.uri).toBe(url);

    // Call loadImage 2 more times to trigger proxy disable
    (Image.loadAsync as jest.Mock)
      .mockImplementationOnce(() => Promise.reject(new Error('proxy fail')))
      .mockImplementationOnce(() => Promise.resolve({ uri: url }));
    await act(async () => {
      await store.loadImage({ originalUrl: url, reqWidth: 100, refCount: 1 });
      await flushPromises();
    });
    (Image.loadAsync as jest.Mock)
      .mockImplementationOnce(() => Promise.reject(new Error('proxy fail')))
      .mockImplementationOnce(() => Promise.resolve({ uri: url }));
    await act(async () => {
      await store.loadImage({ originalUrl: url, reqWidth: 100, refCount: 1 });
      await flushPromises();
    });

    // After 3 proxy→direct successes, proxy should be disabled
    const options = useImageLoaderStore.getState().options;
    expect(typeof options.imgProxyDisabledUntil).toBe('number');
    expect(options.imgProxyDisabledUntil).toBeGreaterThan(Date.now());
  });

  // --- 5. Permanent failure injection ---
  it('loadImage: records permanent failure and error status on repeated failure', async () => {
    const store = useImageLoaderStore.getState();
    const url = 'img/fail.png';

    // Mock Image.loadAsync to always throw
    (Image.loadAsync as jest.Mock).mockRejectedValue(new Error('fail'));

    await act(async () => {
      await store.loadImage({ originalUrl: url, reqWidth: 100, refCount: 1 });
      await flushPromises();
    });

    const state = useImageLoaderStore.getState();
    // eslint-disable-next-line no-console
    console.log('permanentFailures:', Array.from(state.permanentFailures));
    expect(state.permanentFailures.has(url)).toBe(true);
    const cacheEntry = state.imageCache.get(url);
    // eslint-disable-next-line no-console
    console.log('cacheEntry:', cacheEntry);
    expect(cacheEntry).toBeDefined();
    const variation = cacheEntry?.variations.find((v: ImageVariation) => v.reqWidth === 100);
    // eslint-disable-next-line no-console
    console.log('variation:', variation);
    expect(variation?.status).toBe('error');
  });

  // --- 6. Stats.loadingTimes records durations (with fake timers) ---
  it('loadImage: records loading time in stats (fake timers)', async () => {
    const store = useImageLoaderStore.getState();
    const url = 'img/timing.png';
  
    jest.useFakeTimers();
    (Image.loadAsync as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ uri: url }), 100))
    );
  
    const p = store.loadImage({ originalUrl: url, reqWidth: 100, refCount: 1 });
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    await Promise.resolve();
    await new Promise(setImmediate);
    await p;
    jest.useRealTimers();
  
    const times = useImageLoaderStore.getState().stats.loadingTimes[url];
    // eslint-disable-next-line no-console
    console.log('loadingTimes:', times);
    expect(Array.isArray(times)).toBe(true);
    expect(times[0]).toBe(100);
    expect(times[0]).toBeLessThan(500);
  }, 20000);

  // --- 7. clearCache ---
  it('clearCache: resets imageCache and stats', () => {
    // Use setState to populate imageCache and stats
    useImageLoaderStore.setState((state: ImageLoaderState) => {
      state.imageCache.set('img/clear.png', {
        variations: [],
      });
      state.stats.fetched['img/clear.png'] = 1;
      state.stats.loadingTimes['img/clear.png'] = [123];
    });

    const store = useImageLoaderStore.getState();
    act(() => {
      store.clearCache();
    });

    const state = useImageLoaderStore.getState();
    expect(state.imageCache.size).toBe(0);
    expect(state.stats.fetched).toEqual({});
    expect(state.stats.loadingTimes).toEqual({});
  });

  // --- 8. updateConfig ---
  it('updateConfig: updates options', () => {
    const store = useImageLoaderStore.getState();
    act(() => {
      store.updateConfig({ maxConcurrentDownloads: 5 });
    });
    expect(useImageLoaderStore.getState().options.maxConcurrentDownloads).toBe(5);
  });

  // --- 9. removeFromQueue ---
  it('removeFromQueue: decrements refCount and removes when zero', () => {
    const store = useImageLoaderStore.getState();
    const url = 'img/remove.png';

    // Add twice (refCount=2)
    act(() => {
      store.addToQueue(url, 100);
      store.addToQueue(url, 100);
    });
    let normalQueue = useImageLoaderStore.getState().downloadQueues.normal;
    expect(normalQueue.length).toBe(1);
    expect(normalQueue[0].refCount).toBe(2);

    // Remove once (refCount=1)
    act(() => {
      store.removeFromQueue(url, 100);
    });
    normalQueue = useImageLoaderStore.getState().downloadQueues.normal;
    expect(normalQueue.length).toBe(1);
    expect(normalQueue[0].refCount).toBe(1);

    // Remove again (should remove entry)
    act(() => {
      store.removeFromQueue(url, 100);
    });
    normalQueue = useImageLoaderStore.getState().downloadQueues.normal;
    expect(normalQueue.length).toBe(0);
  });

  // --- 10. FS cache early-return branch ---
  it('loadImage: bails out early and caches if getCachePathAsync returns a path', async () => {
    const store = useImageLoaderStore.getState();
    const url = 'img/fs-cache.png';
    const cachePath = '/tmp/img.png';
   
    (Image.getCachePathAsync as jest.Mock).mockResolvedValue(cachePath);
    (Image.loadAsync as jest.Mock).mockResolvedValue({});
   
    await act(async () => {
      await store.loadImage({ originalUrl: url, reqWidth: 100, refCount: 1 });
    });
   
    await flushPromises();
    await flushPromises();
   
    const cacheEntry = useImageLoaderStore.getState().imageCache.get(url);
    expect(cacheEntry).toBeDefined();
    const variation = cacheEntry?.variations.find((v: ImageVariation) => v.reqWidth === 100);
    expect(variation?.status).toBe('loaded');
    expect((variation?.source as any)?.uri).toBe(cachePath);
    expect((Image.loadAsync as jest.Mock)).not.toHaveBeenCalled();
  }, 20000);

  // --- 11. Priority enforcement in processQueue ---
  it('processQueue: high-priority tasks are processed before normal', async () => {
    const store = useImageLoaderStore.getState();
    // Save and stub loadImage so processQueue can finish
    const originalLoadImage = store.loadImage;
    const calls: string[] = [];
    useImageLoaderStore.setState(s => {
      s.loadImage = jest.fn(async (task: ImageTask) => {
        calls.push(task.originalUrl);
        return Promise.resolve();
      });
    });
  
    act(() => {
      store.addToQueue('url-high', 100, 'high');
      store.addToQueue('url-normal', 100, 'normal');
    });
  
    await act(async () => {
      await store.processQueue();
      await flushPromises();
      await flushPromises();
      await new Promise(setImmediate);
    });
  
    // High-priority should be processed first
    expect(calls[0]).toContain('url-high');
    expect(calls[1]).toContain('url-normal');
  
    // Restore original loadImage
    useImageLoaderStore.setState(s => { s.loadImage = originalLoadImage; });
  }, 20000);

  // --- 12. Key-collision edge case ---
  it('addToQueue/removeFromQueue: tasks with same url|width but different priorities do not collide', () => {
    const store = useImageLoaderStore.getState();
    const url = 'img/collision.png';

    // Mock processQueue at the store module level to prevent auto-processing
    const originalProcessQueue = useImageLoaderStore.getState().processQueue;
    useImageLoaderStore.setState((s: typeof store) => {
      s.processQueue = jest.fn();
    });

    // Add same url|width to high and normal
    act(() => {
      store.addToQueue(url, 100, 'high');
      store.addToQueue(url, 100, 'normal');
    });
    const highQueue = useImageLoaderStore.getState().downloadQueues.high;
    const normalQueue = useImageLoaderStore.getState().downloadQueues.normal;
    expect(highQueue.length).toBe(1);
    expect(normalQueue.length).toBe(1);

    // Remove from high, normal should remain
    act(() => {
      store.removeFromQueue(url, 100, 'high');
    });
    expect(useImageLoaderStore.getState().downloadQueues.high.length).toBe(0);
    expect(useImageLoaderStore.getState().downloadQueues.normal.length).toBe(1);

    // Remove from normal, both gone
    act(() => {
      store.removeFromQueue(url, 100, 'normal');
    });
    expect(useImageLoaderStore.getState().downloadQueues.normal.length).toBe(0);

    // Restore original processQueue
    useImageLoaderStore.setState((s: typeof store) => {
      s.processQueue = originalProcessQueue;
    });
  });

  // --- 13. Unused stat fields remain empty (if present) ---
  it('stats: failedImgProxy, failedSource, cacheHits remain empty if present', () => {
    const stats = useImageLoaderStore.getState().stats as any;
    if ('failedImgProxy' in stats) expect(stats.failedImgProxy).toEqual({});
    if ('failedSource' in stats) expect(stats.failedSource).toEqual({});
    if ('cacheHits' in stats) expect(stats.cacheHits).toEqual({});
  });
});