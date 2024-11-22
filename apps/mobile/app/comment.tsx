import { TextInput } from 'react-native-gesture-handler';
import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router, Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import * as User from '@/components/ui/user';
import { Text } from '@/components/nativewindui/Text';
import { Button } from '@/components/nativewindui/Button';
import { NDKEvent, NDKKind, NostrEvent } from '@nostr-dev-kit/ndk-mobile';
import { activeEventStore } from './stores';
import { useStore } from 'zustand';

export default function CommentScreen() {
    const { ndk, currentUser } = useNDK();
    const [comment, setComment] = useState('');
    const activeEvent = useStore(activeEventStore, (state) => state.activeEvent);

    const postComment = async () => {
        const event = new NDKEvent(ndk, {
            kind: NDKKind.Text,
            content: comment,
        } as NostrEvent);
        event.tag(activeEvent, 'root');
        event.tags.push(['K', activeEvent.kind.toString()]);

        await event.sign();
        event.publish();

        // close modal
        router.back();
    };

    return (
        <>
            <View className="flex-1 items-start bg-card p-4">
                <KeyboardAwareScrollView>
                    <View className="w-full flex-row items-start justify-between">
                        <User.Profile pubkey={currentUser!.pubkey}>
                            <View className="mb-4 flex-row items-center gap-2">
                                <User.Avatar size={48} alt="Profile image" />
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
                            className="text-foreground"
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
