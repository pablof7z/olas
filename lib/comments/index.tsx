import { BottomSheetFlashList, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSubscribe } from '@nostr-dev-kit/ndk-hooks';
import { NDKKind, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Comment } from './components/comment';
import NewComment from './components/new-comment';
import { Thread } from './components/thread';
import { replyEventAtom, rootEventAtom } from './store';

import React from '@/components/events/React';

export default function Comments() {
    const rootEvent = useAtomValue(rootEventAtom);

    const { events } = useSubscribe(
        rootEvent
            ? [
                  { kinds: [NDKKind.Text, NDKKind.GenericReply], ...rootEvent.filter() },
                  { kinds: [NDKKind.GenericReply], ...rootEvent.nip22Filter() },
              ]
            : false,
        { groupable: false, closeOnEose: false, subId: 'comments' },
        [rootEvent?.id]
    );

    const filteredComments = useMemo(() => {
        if (!rootEvent) return [];
        const [tagKey, tagValue] = rootEvent.tagReference();
        return [rootEvent, ...events.filter((e) => e.tagValue(tagKey) === tagValue)];
    }, [events]);

    const currentUser = useNDKCurrentUser();

    // clean up reply event when the screen is unmounted
    const setReplyEvent = useSetAtom(replyEventAtom);
    useEffect(() => {
        return () => {
            setReplyEvent(null);
        };
    }, [setReplyEvent]);

    return (
        <View style={styles.container}>
            <BottomSheetView className="w-full flex-1" style={styles.innerContainer}>
                <BottomSheetFlashList
                    data={filteredComments}
                    renderItem={({ item }) => {
                        if (item.id === rootEvent?.id) return <Comment item={item} />;
                        return <Thread event={item} indentLevel={0} isRoot />;
                    }}
                    estimatedItemSize={50}
                    keyExtractor={(item) => item.id}
                />
                {currentUser && rootEvent && (
                    <NewComment
                        event={rootEvent}
                        currentUser={currentUser}
                        autoFocus={filteredComments.length < 2}
                    />
                )}
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
    },
});
