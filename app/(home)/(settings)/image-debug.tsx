import { IconView } from '@/components/icon-view';
import useImageLoaderStore from '@/lib/image-loader/store';
import type { ImageTask } from '@/lib/image-loader/types';
import { useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '~/components/nativewindui/Text';

// Helper function similar to queueItemKey in the store
function taskToKey(task: ImageTask): string {
    return `${task.originalUrl}|${task.reqWidth}`;
}

function ActiveDownloadItem({ key, meta }: { key: string; meta: any }) {
    const [now, setNow] = useState(Date.now());

    useMemo(() => {
        if (!meta) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [key]);

    const timeLeft = meta
        ? Math.max(0, Math.floor((meta.timeoutMs - (now - meta.startTime)) / 1000))
        : 0;

    return (
        <Text key={key} className="py-1 text-xs break-all" selectable>
            {formatKey(key)}{' '}
            <Text style={{ color: timeLeft <= 2 ? 'red' : 'orange' }}>[{timeLeft}s left]</Text>
        </Text>
    );
}

function formatKey(key: string) {
    // key is `${url}|${width}x${height}`
    const [url, size] = key.split('|');
    return size ? `${url} [${size}]` : url;
}

export default function ImageDebugScreen() {
    const store = useImageLoaderStore();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    // Define categories inside the component for correct typing
    const CATEGORY_CONFIG = [
        {
            key: 'queue',
            title: 'Images in Queue',
            icon: 'download-outline',
            getItems: () => [
                ...store.downloadQueues.high.map(taskToKey),
                ...store.downloadQueues.normal.map(taskToKey),
                ...store.downloadQueues.low.map(taskToKey),
            ],
        },
        {
            key: 'fetched',
            title: 'Fetched This Session',
            icon: 'checkmark-circle-outline',
            getItems: () => Object.keys(store.stats.fetched),
        },
        {
            key: 'averageLoadingTime',
            title: 'Average Loading Time (ms)',
            icon: 'timer-outline',
            getItems: () => Object.keys(store.stats.loadingTimes),
        },
        {
            key: 'activeDownloads',
            title: 'Images being fetched',
            icon: 'cloud-download-outline',
            getItems: () => Object.keys(store.activeDownloadMeta),
        },
        undefined,
        {
            key: 'failures',
            title: 'Image Loading Failures',
            icon: 'alert-circle-outline',
            getItems: () => store.loadingFailures,
        },
    ];

    // Compute averages for loading times
    const averageLoadingTimes = useMemo(() => {
        const result: Record<string, number> = {};
        for (const [key, times] of Object.entries(store.stats.loadingTimes)) {
            if (times.length > 0) {
                result[key] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            }
        }
        return result;
    }, [store.stats.loadingTimes]);

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="px-0">
                <Text className="text-lg font-bold px-4 py-2">Image Preload Debug</Text>
                {CATEGORY_CONFIG.filter(Boolean).map((cat) => {
                    // Type assertion to silence "possibly undefined" error
                    const category = cat as {
                        key: string;
                        title: string;
                        icon: string;
                        getItems: () => any[];
                    };
                    let items: string[] | { key: string; avg: number }[] | any[] =
                        category.getItems();
                    if (category.key === 'averageLoadingTime') {
                        items = (items as string[]).map((key) => ({
                            key,
                            avg: averageLoadingTimes[key] ?? 0,
                        }));
                    }
                    const isExpanded = !!expanded[category.key];
                    return (
                        <View key={category.key}>
                            <TouchableOpacity
                                onPress={() =>
                                    setExpanded((prev) => ({
                                        ...prev,
                                        [category.key]: !prev[category.key],
                                    }))
                                }
                                className="flex-row items-center px-4 py-3 bg-card border-b border-border"
                            >
                                <IconView name={category.icon as any} className="mr-3 bg-primary" />
                                <Text className="flex-1 text-base font-medium">
                                    {category.title}
                                </Text>
                                <Text className="text-xs text-muted-foreground">
                                    {items.length}
                                </Text>
                                <Text className="ml-2 text-lg">{isExpanded ? '▼' : '▶'}</Text>
                            </TouchableOpacity>
                            {isExpanded && (
                                <View className="bg-muted px-4 py-2">
                                    {items.length === 0 ? (
                                        <Text className="text-muted-foreground italic">
                                            No items.
                                        </Text>
                                    ) : category.key === 'averageLoadingTime' ? (
                                        (items as { key: string; avg: number }[]).map((item) => (
                                            <View
                                                key={item.key}
                                                className="flex-row justify-between py-1"
                                            >
                                                <Text className="flex-1">
                                                    {formatKey(item.key)}
                                                </Text>
                                                <Text className="text-right text-xs text-muted-foreground">
                                                    {item.avg} ms
                                                </Text>
                                            </View>
                                        ))
                                    ) : category.key === 'failures' ? (
                                        (items as any[]).map((failure, idx) => (
                                            <View
                                                key={failure.timestamp ?? idx}
                                                className="mb-2 p-2 rounded bg-destructive/10 border border-destructive"
                                            >
                                                <Text className="text-xs font-semibold text-destructive mb-1">
                                                    {failure.error}
                                                </Text>
                                                <Text className="text-xs break-all" selectable>
                                                    URI: {failure.uri}
                                                </Text>
                                                <Text className="text-xs text-muted-foreground">
                                                    Width: {failure.reqWidth}
                                                </Text>
                                                <Text className="text-xs text-muted-foreground">
                                                    Load time: {failure.relativeTimeMs} ms
                                                </Text>
                                                <Text className="text-2xs text-muted-foreground">
                                                    {new Date(failure.timestamp).toLocaleString()}
                                                </Text>
                                            </View>
                                        ))
                                    ) : (
                                        (items as string[]).map((key) => {
                                            if (category.key === 'activeDownloads') {
                                                return (
                                                    <ActiveDownloadItem
                                                        key={key}
                                                        meta={store.activeDownloadMeta[key]}
                                                    />
                                                );
                                            }
                                            // Default rendering for other categories
                                            return (
                                                <Text
                                                    key={key}
                                                    className="py-1 text-xs break-all"
                                                    selectable
                                                >
                                                    {formatKey(key)}
                                                </Text>
                                            );
                                        })
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}
