import { TextInput } from "react-native-gesture-handler";
import { KeyboardAvoidingView, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { router, Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { useNDK, useSubscribe } from "@/ndk-expo";
import * as User from '@/ndk-expo/components/user';
import { Text } from "@/components/nativewindui/Text";
import { Button } from "@/components/nativewindui/Button";
import { NDKEvent, NDKKind, NostrEvent } from "@nostr-dev-kit/ndk";
import { activeEventStore } from "./stores";
import { useStore } from "zustand";

export default function CommentScreen() {
    const { ndk, currentUser } = useNDK();
    const [comment, setComment] = useState('');
    const activeEvent = useStore(activeEventStore, (state) => state.activeEvent);

    const postComment = async () => {
        const event = new NDKEvent(ndk, {
            kind: NDKKind.Text,
            content: comment,
        } as NostrEvent);
        event.tag(activeEvent, "root");

        await event.sign();
        event.publish();

        // close modal
        router.back();
    }
    
    return (
        <>
            <View className="flex-1 p-4 items-start bg-card">
                <KeyboardAwareScrollView>
                    <View className="flex-row justify-between w-full items-start">
                        <User.Profile pubkey={currentUser!.pubkey}>
                            <View className="flex-row items-center gap-2 mb-4">
                                <User.Avatar alt="Profile image" />
                                <Text className="text-lg font-bold">
                                    <User.Name />
                                </Text>
                            </View>
                        </User.Profile>

                        <Button variant="plain" onPress={postComment}>
                            <Text>Post</Text>
                        </Button>
                    </View>
                    
                    <View className="grow">
                        <TextInput
                            placeholder="Add a comment..."
                            multiline
                            autoFocus
                            value={comment}
                            onChangeText={setComment}
                        />
                    </View>
                </KeyboardAwareScrollView>
            </View>
        </>
    );
}
