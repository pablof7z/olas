import { BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import {
    type Hexpubkey,
    type NDKEvent,
    type NDKUser,
    type NDKUserProfile,
    useNDK,
    useProfileValue,
} from '@nostr-dev-kit/ndk-mobile';
import { useAtom, useSetAtom } from 'jotai';
import { Send } from 'lucide-react-native';
import { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import {
    type NativeSyntheticEvent,
    StyleSheet,
    Text,
    TextInput,
    TextInputKeyPressEventData,
    type TextInputSelectionChangeEventData,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mentionQueryAtom, replyEventAtom } from '../store';

import * as User from '@/components/ui/user';
import { useUserFlare } from '@/lib/user/stores/flare';
import MentionSuggestions from '@/lib/mentions/mention-suggestions';
import { useColorScheme } from '@/lib/useColorScheme';

export default function NewComment({
    event,
    currentUser,
    autoFocus,
}: { event: NDKEvent; currentUser: NDKUser; autoFocus: boolean }) {
    const userProfile = useProfileValue(currentUser?.pubkey, {
        subOpts: { skipVerification: true },
    });
    const { colors } = useColorScheme();
    const [comment, setComment] = useState('');
    const insets = useSafeAreaInsets();
    const [replyEvent, setReplyEvent] = useAtom(replyEventAtom);
    const flare = useUserFlare(currentUser?.pubkey);
    const [mentionQuery, setMentionQuery] = useAtom(mentionQueryAtom);

    const handleChangeText = useCallback((text: string) => {
        commentRef.current = text;
        setComment(text);
    }, []);

    // const handleKeyPress = useCallback((event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    //     console.log(event.nativeEvent.key);
    //     if (event.nativeEvent.key === '@') {
    //         console.log('@');
    //         event.preventDefault();
    //         event.stopPropagation();@
    //         setComment('');
    //         setShowMentionSuggestions(true);
    //     }
    // }, [showMentionSuggestions]);

    const { ndk } = useNDK();

    const reset = useCallback(() => {
        mentionRefs.current = {};
        commentRef.current = '';
        setMentionQuery(null);
        setComment('');
        setReplyEvent(null);
    }, []);

    const handleSend = useCallback(async () => {
        const commentEvent = (replyEvent || event).reply();
        commentEvent.content = comment;

        // replace the @ mentions with the nostr:npub1
        for (const [key, value] of Object.entries(mentionRefs.current)) {
            try {
                const pubkey = value.pubkey as string;
                const user = ndk?.getUser({ pubkey });
                commentEvent.content = commentEvent.content.replace(
                    `@${key}`,
                    `nostr:${user?.nprofile}`
                );
            } catch (error) {
                console.error(error);
            }
        }

        await commentEvent.sign();
        commentEvent.publish();
        reset();
    }, [event.id, comment, replyEvent]);

    const commentRef = useRef<string>('');
    const mentionBeginRef = useRef<number>(0);

    const mentionRefs = useRef<{ [key: string]: NDKUserProfile }>({});

    const handleSelectionChange = useCallback(
        (nativeEvent: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
            const startPos = nativeEvent.nativeEvent.selection.start;
            const endPos = nativeEvent.nativeEvent.selection.end;

            // if the selection is 1 char long and the char is @, set the showMentionSuggestions to true
            if (startPos === endPos) {
                const text = commentRef.current;

                // get the word at the current position
                const beforeCursor = text.slice(0, startPos);
                const words = beforeCursor.split(/\s/);
                const currentWord = words[words.length - 1];

                mentionBeginRef.current = text.lastIndexOf(currentWord);

                // if the word starts with @, set the showMentionSuggestions to true and set the query to the word
                if (currentWord.startsWith('@')) {
                    const query = currentWord.slice(1); // Remove the @ symbol
                    setMentionQuery(query);
                } else {
                    // if it doesnt start with @, set the showMentionSuggestions to false
                    setMentionQuery('');
                }
            }
        },
        [setMentionQuery]
    );

    const handleMentionPress = useCallback(
        (_pubkey: Hexpubkey, profile: NDKUserProfile) => {
            let text = commentRef.current;
            let mention = profile.name?.trim?.();
            mention ??= profile.nip05?.trim?.();
            mention ??= profile.pubkey as string;
            text = text.replace(`@${mentionQuery}`, `@${mention} `);
            mentionRefs.current[mention] = profile;
            setMentionQuery(null);
            setComment(text);
        },
        [mentionQuery, setMentionQuery, setComment]
    );

    const containerStyle = useMemo(() => {
        return { paddingBottom: insets.bottom, flex: mentionQuery ? 1 : 0 };
    }, [insets.bottom, mentionQuery]);

    return (
        <BottomSheetView
            style={[styles.container, containerStyle]}
            className="border-t border-border"
        >
            {mentionQuery && (
                <MentionSuggestions query={mentionQuery} onPress={handleMentionPress} />
            )}

            <View style={styles.inputContainer}>
                <User.Avatar
                    pubkey={currentUser?.pubkey}
                    userProfile={userProfile}
                    imageSize={24}
                    flare={flare}
                    borderWidth={1}
                    canSkipBorder
                />
                <BottomSheetTextInput
                    style={styles.input}
                    className="text-foreground"
                    value={comment}
                    autoFocus={autoFocus}
                    enablesReturnKeyAutomatically
                    onSelectionChange={handleSelectionChange}
                    // onKeyPress={handleKeyPress}
                    onChangeText={handleChangeText}
                    onSubmitEditing={handleSend}
                    placeholder="Type a message..."
                    multiline
                    returnKeyType="send"
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    disabled={!comment.trim()}
                    onPress={handleSend}
                >
                    <Send size={20} color={colors.foreground} />
                </TouchableOpacity>
            </View>
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        padding: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    sendButton: {
        padding: 10,
    },
});
