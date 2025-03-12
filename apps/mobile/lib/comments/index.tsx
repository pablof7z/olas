import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNDKCurrentUser, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import React from '@/components/events/React';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useAtomValue, useSetAtom } from 'jotai';
import { replyEventAtom, rootEventAtom } from './store';
import { Comment } from './components/comment';
import { Thread } from './components/thread';
import NewComment from './components/new-comment';
import { BottomSheetFlashList, BottomSheetView } from '@gorhom/bottom-sheet';

export default function Comments() {
    const rootEvent = useAtomValue(rootEventAtom);

    const { events } = useSubscribe( rootEvent ? [
        { kinds: [NDKKind.Text, NDKKind.GenericReply], ...rootEvent.filter() },
        { kinds: [NDKKind.GenericReply], ...rootEvent.nip22Filter() },
    ] : false, { groupable: false, closeOnEose: false, subId: 'comments' }, [ rootEvent?.id ]);

    const filteredComments = useMemo(() => {
        if (!rootEvent) return [];
        const [tagKey, tagValue] = rootEvent.tagReference();
        return [
            rootEvent,
            ...events.filter(e => e.tagValue(tagKey) === tagValue)
        ]
    }, [events]);

    const currentUser = useNDKCurrentUser();
    
    // clean up reply event when the screen is unmounted
    const setReplyEvent = useSetAtom(replyEventAtom);
    useEffect(() => {
        return () => { setReplyEvent(null); }
    }, [setReplyEvent]);

    return (
        <View
            style={styles.container}
        >
                <BottomSheetView className="w-full flex-1" style={styles.innerContainer}>
                <BottomSheetFlashList
                    data={filteredComments}
                    renderItem={({ item }) => {
                        if (item.id === rootEvent?.id) return <Comment item={item} />
                        return <Thread event={item} indentLevel={0} isRoot={true} />
                    }}
                    estimatedItemSize={50}
                    keyExtractor={(item) => item.id}
                />
                    {currentUser && rootEvent && <NewComment event={rootEvent} currentUser={currentUser} autoFocus={filteredComments.length < 2} />}
                </BottomSheetView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
    },
    message: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: '#ccc',
    }
});
  