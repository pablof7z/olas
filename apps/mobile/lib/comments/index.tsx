import { useEffect, useMemo, useRef } from 'react';
import { KeyboardAvoidingView, Platform, View, TouchableWithoutFeedback, Keyboard, StyleSheet, Text } from 'react-native';
import { NDKEvent, useNDKCurrentUser, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import React from '@/components/events/React';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAtomValue, useSetAtom } from 'jotai';
import { replyEventAtom, rootEventAtom } from './store';
import { Comment } from './components/comment';
import { Thread } from './components/thread';
import NewComment from './new-comment';
import { BottomSheetFlashList, BottomSheetView } from '@gorhom/bottom-sheet';

export default function Comments() {
    const rootEvent = useAtomValue<NDKEvent>(rootEventAtom);

    const { events } = useSubscribe([
        { kinds: [NDKKind.Text, NDKKind.GenericReply], ...rootEvent.filter() },
        { kinds: [NDKKind.GenericReply], ...rootEvent.nip22Filter() },
    ], { groupable: false, closeOnEose: false, subId: 'comments' }, [ rootEvent.id]);
    console.log('rendering comments', rootEvent.id, events.length)

    const filteredComments = useMemo(() => {
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

    const style = useMemo(() => {
        const isAndroid = Platform.OS === 'android';
        if (isAndroid) {
            return {
                paddingTop: 10,
            }
        } else {
            return {
                paddingVertical: 20,
            }
        }
    }, [Platform.OS, 1])
    
    return (
        <View
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <BottomSheetView className="w-full flex-1" style={styles.innerContainer}>
                    <BottomSheetView className="flex-1 w-full">
                    <BottomSheetFlashList
                        data={filteredComments}
                        renderItem={({ item }) => {
                            if (item.id === rootEvent.id) return <Comment item={item} />
                            return <Thread event={item} indentLevel={0} isRoot={true} />
                        }}
                        estimatedItemSize={50}
                        keyExtractor={(item) => item.id}
                    />
                    </BottomSheetView>
                    {currentUser && <NewComment event={rootEvent} currentUser={currentUser} autoFocus={filteredComments.length < 2} />}
                </BottomSheetView>
            </TouchableWithoutFeedback>
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
  