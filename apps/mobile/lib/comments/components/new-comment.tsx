import { NDKEvent, NDKUser, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { useAtom, useSetAtom } from "jotai";
import { Send } from "lucide-react-native";
import { NativeSyntheticEvent, Text, TextInputKeyPressEventData } from "react-native";
import { useState, useCallback } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { replyEventAtom, showMentionSuggestionsAtom } from "../store";
import { useColorScheme } from "@/lib/useColorScheme";
import * as User from "@/components/ui/user";
import { useUserFlare } from "@/hooks/user-flare";
import { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import MentionSuggestions from './mention-suggestions';

export default function NewComment({ event, currentUser, autoFocus }: { event: NDKEvent, currentUser: NDKUser, autoFocus: boolean }) {
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const { colors } = useColorScheme();
    const [comment, setComment] = useState('');
    const insets = useSafeAreaInsets();
    const [replyEvent, setReplyEvent] = useAtom<NDKEvent | null>(replyEventAtom);
    const flare = useUserFlare(currentUser?.pubkey);
    const [showMentionSuggestions, setShowMentionSuggestions] = useAtom(showMentionSuggestionsAtom);

    const handleChangeText = useCallback((text: string) => {
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

    const handleSend = useCallback(async () => {
        const commentEvent = (replyEvent || event).reply();
        commentEvent.content = comment;
        await commentEvent.sign();
        commentEvent.publish();
        setComment('');
        setReplyEvent(null);
    }, [event.id, comment, replyEvent]);

    return (
        <BottomSheetView
            style={[styles.inputContainer, { paddingBottom: insets.bottom }]}
            className="border-t border-border items-start"
        > 
            {/* {showMentionSuggestions && <MentionSuggestions query={comment} />} */}
            {!showMentionSuggestions && (
                <User.Avatar pubkey={currentUser?.pubkey} userProfile={userProfile} imageSize={24} flare={flare} borderWidth={1} canSkipBorder={true} />
            )}
                <BottomSheetTextInput
                    style={styles.input}
                    className="text-foreground"
                    value={comment}
                    autoFocus={autoFocus}
                    enablesReturnKeyAutomatically={true}
                    // onKeyPress={handleKeyPress}
                    onChangeText={handleChangeText}
                    onSubmitEditing={handleSend}
                    placeholder="Type a message..."
                    multiline
                    returnKeyType="send"
                />
            {!showMentionSuggestions && (
                <TouchableOpacity style={styles.sendButton} disabled={!comment.trim()} onPress={handleSend}>
                    <Send size={20} color={colors.foreground} />
                </TouchableOpacity>
            )}
        </BottomSheetView>
    )
}

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
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
    }
});
