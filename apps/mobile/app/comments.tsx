import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View, TouchableWithoutFeedback, Keyboard, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import { NDKEvent, NDKUser, useNDKCurrentUser, useSubscribe, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import * as User from '@/components/ui/user';
import React from '@/components/events/React';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';
import * as Clipboard from 'expo-clipboard';
import { FlashList } from '@shopify/flash-list';
import EventContent from '@/components/ui/event/content';
import RelativeTime from './components/relative-time';
import { Text } from '@/components/nativewindui/Text';
import { Heart, MessageCircle, Send } from 'lucide-react-native';
import { Button } from '@/components/nativewindui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/lib/useColorScheme';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { cn } from '@/lib/cn';
import { router } from 'expo-router';
import { useObserver } from '@/hooks/observer';
import { activeEventAtom } from '@/stores/event';
import { toast } from '@backpackapp-io/react-native-toast';

const replyEventAtom = atom<NDKEvent | null, [NDKEvent | null], null>(null, (get, set, value) => set(replyEventAtom, value));

const Thread = ({ event, indentLevel = 0 }: { event: NDKEvent, indentLevel: number }) => {
    const events = useObserver([
        { kinds: [NDKKind.Text, NDKKind.GenericReply], ...event.filter() },
    ], [event.id]);
    
    return <View className="flex-1 flex-col">
        <Comment item={event} style={{ paddingLeft: (indentLevel + 1) * 20 }} />
        {events.length > 0 && (
            <View className="flex-1 flex-col gap-2">
                {events.map(event => <Thread key={event.id} event={event} indentLevel={indentLevel + 1} />)}
            </View>
        )}
    </View>
}

const Comment = ({ item, style }: { item: NDKEvent, style?: StyleProp<ViewStyle> }) => {
    const { userProfile } = useUserProfile(item.pubkey);
    const [replyEvent, setReplyEvent] = useAtom<NDKEvent>(replyEventAtom);
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const reactions = useObserver(
        [{ kinds: [NDKKind.Reaction], '#e': [item.id] }],
        [item.id]
    );

    const onReplyPress = useCallback(() => {
        setReplyEvent(item);
    }, [item, setReplyEvent]);

    const isReplying = useMemo(() => {
        return item.id === replyEvent?.id;
    }, [item, replyEvent?.id]);

    const copyEventId = useCallback(() => {
        Clipboard.setStringAsync(item.encode());
        toast.success('Event ID copied to clipboard');
    }, [item.id]);

    return (
        <View className={cn(
            "flex-1 flex-row gap-4 py-2 px-4 transition-all duration-300 w-full items-start",
            isReplying && "bg-accent/10"
        )} style={style}>
            <Pressable onPress={() => router.push(`/profile?pubkey=${item.pubkey}`)}>
                <User.Avatar pubkey={item.pubkey} userProfile={userProfile} imageSize={24} />
            </Pressable>

            <View className="flex-col flex-1">
                <View className="flex-row items-center gap-1">
                    <User.Name userProfile={userProfile} pubkey={item.pubkey} className="font-bold text-foreground" />
                    <RelativeTime timestamp={item.created_at} className="text-xs text-muted-foreground" />
                </View>

                <Pressable onPress={onReplyPress} onLongPress={copyEventId}>
                    <EventContent event={item} className="text-sm text-foreground" />
                    <Text className="text-xs text-muted-foreground">Reply</Text>
                </Pressable>
            </View>

            <React
                event={item}
                inactiveColor={colors.foreground}
                reactionCount={reactions.length}
                reactedByUser={reactions.find(r => r.pubkey === currentUser?.pubkey)}
                iconSize={18}
                showReactionCount={false}
            />
        </View>
    );
};

export default function CommentScreen() {
    const activeEvent = useAtomValue<NDKEvent>(activeEventAtom);
    const flashListRef = useRef<FlashList<NDKEvent>>(null);

    const { events } = useSubscribe([
        { kinds: [NDKKind.Text, NDKKind.GenericReply], ...activeEvent.filter() },
        { kinds: [NDKKind.GenericReply], ...activeEvent.nip22Filter() },
    ], { groupable: false, closeOnEose: false, subId: 'comments' }, [ activeEvent.id]);

    const filteredComments = useMemo(() => {
        const [tagKey, tagValue] = activeEvent.tagReference();
        return [
            activeEvent,
            ...events.filter(e => e.tagValue(tagKey) === tagValue)
        ]
    }, [events]);
    const insets = useSafeAreaInsets();

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
        <KeyboardAvoidingView
            style={{...styles.container, ...style, paddingBottom: insets.bottom}}
            className="bg-card"
            behavior={'padding'}
            keyboardVerticalOffset={90}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="w-full" style={styles.innerContainer}>
                    <View className="flex-1 w-full">
                    <FlashList
                        ref={flashListRef}
                        data={filteredComments}
                        renderItem={({ item }) => {
                            if (item.id === activeEvent.id) return <Comment item={item} />
                            return <Thread event={item} indentLevel={0} />
                        }}
                        estimatedItemSize={50}
                        keyExtractor={(item) => item.id}
                        style={{ flex: 1, width: '100%'  }}
                    />
                    </View>
                    {currentUser && <NewComment event={activeEvent} currentUser={currentUser} />}
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

function NewComment({ event, currentUser }: { event: NDKEvent, currentUser: NDKUser }) {
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const { colors } = useColorScheme();
    const [comment, setComment] = useState('');
    const insets = useSafeAreaInsets();
    const [replyEvent, setReplyEvent] = useAtom<NDKEvent>(replyEventAtom);

    const handleSend = useCallback(async () => {
        const commentEvent = (replyEvent || event).reply();
        commentEvent.content = comment;
        await commentEvent.sign();
        commentEvent.publish();
        setComment('');
        setReplyEvent(null);
    }, [event.id, comment, replyEvent]);

    return (
        <View
            style={[styles.inputContainer, { paddingBottom: insets.bottom }]}
            className="border-t border-border flex-row items-start"
        > 
            <User.Avatar pubkey={currentUser?.pubkey} userProfile={userProfile} imageSize={24} />
            <TextInput
                style={styles.input}
                className="text-foreground"
                value={comment}
                onChangeText={setComment}
                placeholder="Type a message..."
                multiline
                returnKeyType="done"
            />
            <Button variant="plain" disabled={!comment.trim()} onPress={handleSend}>
                <Send size={20} color={colors.foreground} />
            </Button>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    innerContainer: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
    },
    message: {
      padding: 10,
      borderBottomWidth: 1,
      borderColor: '#ccc',
    },
    inputContainer: {
      flexDirection: 'row',
      paddingTop: 10,
      paddingHorizontal: 10,
    },
    input: {
      flex: 1,
      padding: 10,
      borderRadius: 5,
      marginRight: 10,
    },
  });
  