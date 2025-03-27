import { NDKKind, NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Comment } from './comment';

import { useObserver } from '@/hooks/observer';

export function Thread({ event, indentLevel = 0, isRoot = false }: { event: NDKEvent; indentLevel: number; isRoot: boolean }) {
    const events = useObserver([{ kinds: [NDKKind.Text, NDKKind.GenericReply], ...event.filter() }], {}, [event.id]);

    const style = useMemo(() => {
        if (isRoot) return {};
        return { paddingLeft: (indentLevel + 1) * 20 };
    }, [isRoot, indentLevel]);

    return (
        <View style={styles.container}>
            <Comment item={event} style={style} />
            {events.length > 0 && (
                <View className="flex-1 flex-col gap-2">
                    {events.map((event) => (
                        <Thread key={event.id} event={event} indentLevel={indentLevel + 1} isRoot={false} />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
});
