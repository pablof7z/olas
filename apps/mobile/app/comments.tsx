import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, SafeAreaView, TextInput, View, TouchableWithoutFeedback, Keyboard, StyleSheet, Pressable } from 'react-native';
import { NDKEvent, NDKSubscriptionCacheUsage, useNDKCurrentUser, useSubscribe, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import * as User from '@/components/ui/user';
import React from '@/components/events/React';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';

import { useStore } from 'zustand';
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

const replyEventAtom = atom<NDKEvent | null, [NDKEvent | null], null>(null, (get, set, value) => set(replyEventAtom, value));

const Thread = ({ event }: { event: NDKEvent }) => {
    const filters = [
        { kinds: [NDKKind.Text, NDKKind.GenericReply], '#e': [event.id] },
    ]
    const events = useObserver(filters, event.id);
    console.log('asking for replies to event "'+event.content+'" received'+events.length);
    
    return <View className="flex-1 flex-col">
        <Comment item={event} />
        {events.length > 0 && (
            <View className="flex-1 flex-col gap-2 pl-6">
                {events.map(event => <Thread key={event.id} event={event} />)}
            </View>
        )}
    </View>
}

const Comment = ({ item }: { item: NDKEvent }) => {
    const { userProfile } = useUserProfile(item.pubkey);
    const [replyEvent, setReplyEvent] = useAtom(replyEventAtom);
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();

    const reactions = useObserver(
        [{ kinds: [NDKKind.Reaction], '#e': [item.id] }],
        item.id
    );

    const onReplyPress = useCallback(() => {
        setReplyEvent(item);
    }, [item, setReplyEvent]);

    const isReplying = useMemo(() => {
        return item.id === replyEvent?.id;
    }, [item, replyEvent?.id]);

    return (
        <View className={cn(
            "flex-1 flex-row gap-4 py-2 px-4 transition-all duration-300 w-full items-start",
            isReplying && "bg-accent/10"
        )}>
            <Pressable onPress={() => router.push(`/profile?pubkey=${item.pubkey}`)}>
                <User.Avatar userProfile={userProfile} alt="Profile image" className="h-8 w-8" />
            </Pressable>

            <View className="flex-col flex-1">
                <View className="flex-row items-center gap-1">
                    <User.Name userProfile={userProfile} pubkey={item.pubkey} className="font-bold text-foreground" />
                    <RelativeTime timestamp={item.created_at} className="text-xs text-muted-foreground" />
                </View>

                <EventContent event={item} className="text-sm text-foreground" />

                <Pressable onPress={onReplyPress}>
                    <Text className="text-xs text-muted-foreground">Reply</Text>
                </Pressable>
            </View>

            <React
                event={item}
                mutedColor={colors.muted}
                iconSize={18}
                allReactions={reactions}
                showReactionCount={false}
                currentUser={currentUser}
            />
        </View>
    );
};

export default function CommentScreen() {
    const activeEvent = useAtomValue(activeEventAtom);
    const flashListRef = useRef<FlashList<NDKEvent>>(null);

    const filters = useMemo(() => {
        let filter = {};
        const eventFilter = activeEvent.filter();
        Object.entries(eventFilter).forEach(([key, value]) => {
            filter[key.toUpperCase()] = value;
        });
        return [
            { kinds: [NDKKind.GenericReply], ...filter },
            { kinds: [NDKKind.Text, NDKKind.GenericReply], ...eventFilter },
        ];
    }, [activeEvent.id]);
    const opts = useMemo(() => ({ groupable: false, closeOnEose: false, subId: 'comments' }), []);
    const { events } = useSubscribe({ filters, opts });

    const [comment, setComment] = useState('');

    const filteredComments = useMemo(() => {
        const [tagKey, tagValue] = activeEvent.tagReference();
        return [
            activeEvent,
            ...events.filter(e => e.tagValue(tagKey) === tagValue)
        ]
    }, [events]);
    const insets = useSafeAreaInsets();
    const { colors } = useColorScheme();

    const currentUser = useNDKCurrentUser();
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const [replyTo, setReplyTo] = useAtom(replyEventAtom);

    const handleSend = useCallback(async () => {
        const commentEvent = (replyTo || activeEvent).reply();
        commentEvent.content = comment;
        await commentEvent.sign();
        commentEvent.publish();
        setComment('');
        setReplyTo(null);
        console.log('comment sent', JSON.stringify(commentEvent.rawEvent(), null, 2));
    }, [activeEvent, comment]);

    const style = useMemo(() => {
        const isAndroid = Platform.OS === 'android';
        if (isAndroid) {
            return {
                paddingTop: insets.top,
            }
        } else {
            return {
                paddingVertical: 20,
            }
        }
    }, [Platform.OS, 1])
    
    return (
        <KeyboardAvoidingView
            style={{...styles.container, ...style}}
            className="bg-card border border-border"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="w-full" style={styles.innerContainer}>
                    <View className="flex-1 w-full">
                    <FlashList
                        ref={flashListRef}
                        data={filteredComments}
                        renderItem={({ item }) => {
                            if (item.id === activeEvent.id) return <Comment item={item} />
                            return <Thread event={item} />
                        }}
                        estimatedItemSize={50}
                        keyExtractor={(item) => item.id}
                        style={{ flex: 1, width: '100%'  }}
                    />
                    </View>
                    <View
                        style={[styles.inputContainer, { paddingBottom: insets.bottom }]}
                        className="border-t border-border flex-row items-start"
                    > 
                        <User.Avatar userProfile={userProfile} alt="Profile image" className="h-8 w-8" />
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
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
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
  