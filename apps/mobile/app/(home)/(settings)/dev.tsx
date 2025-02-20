import { NDKCacheAdapterSqlite, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { Text } from '@/components/nativewindui/Text';
import { List, ListItem } from '@/components/nativewindui/List';
import { cn } from '@/lib/cn';
import { SQLiteDatabase } from 'expo-sqlite';

type Row = { id: string; title: string; value: string };

function getSubscriptions(): Row[] {
    const { ndk } = useNDK();
    const subManager = ndk.subManager;
    const subscriptions = subManager.subscriptions;

    return [
        {
            id: 'subscriptions',
            title: 'Subscriptions',
            value: subscriptions.size.toString(),
        },
    ];
}

function getProfileCount(db: SQLiteDatabase): Row[] {
    const data = db.getAllSync('SELECT * FROM profiles') as { id: string; pubkey: string; name: string }[];
    const mappedData: Row[] = [];

    mappedData.push({
        id: 'total-profiles',
        title: 'Total profiles',
        value: data.length.toString(),
    });

    return mappedData;
}

function getUnpublishedEvents(db: SQLiteDatabase): Row[] {
    const data = db.getAllSync('SELECT * FROM unpublished_events') as { id: string; kind: number; content: string }[];
    return [{
        id: 'unpublished-events',
        title: 'Unpublished events',
        value: data.length.toString()
    }]
}

function getEventCount(db: SQLiteDatabase): Row[] {
    const data = db.getAllSync('SELECT * FROM events') as { id: string; kind: number; content: string }[];
    const mappedData: Row[] = [];

    mappedData.push({
        id: 'total',
        title: 'Total events',
        value: data.length.toString(),
    });

    const perKind = new Map<number, number>();
    for (const item of data) {
        perKind.set(item.kind, (perKind.get(item.kind) || 0) + 1);
    }

    for (const [kind, count] of perKind) {
        mappedData.push({
            id: kind.toString(),
            title: `Kind ${kind}`,
            value: count.toString(),
        });
    }

    return mappedData;
}

export default function DevScreen() {
    const { ndk } = useNDK();
    const adapter = ndk.cacheAdapter;

    if (!(adapter instanceof NDKCacheAdapterSqlite)) {
        return <Text>Not using sqlite</Text>;
    }

    const db = adapter.db;

    const data: Row[] = [];
    data.push(...getSubscriptions());
    data.push(...getUnpublishedEvents(db));
    data.push(...getProfileCount(db));
    data.push(...getEventCount(db));

    return (
        <List
            data={data}
            estimatedItemSize={50}
            keyExtractor={(item) => item.id}
            variant="full-width"
            renderItem={({ item, target, index }) => (
                <ListItem
                    item={item}
                    className={cn('ios:pl-0 pr-2', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
                    titleClassName="text-lg"
                    index={index}
                    target={target}
                    rightView={<Text>{item.value}</Text>}
                />
            )}
        />
    );
}
