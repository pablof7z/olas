import { useMemo } from 'react';
import { Dimensions, SafeAreaView, View } from 'react-native';
import { NDKEvent, useSubscribe, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import * as User from '@/components/ui/user';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { activeEventStore } from './stores';
import { useStore } from 'zustand';
import { FlashList } from '@shopify/flash-list';
import EventContent from '@/components/ui/event/content';
import RelativeTime from './components/relative-time';
import { Text } from '@/components/nativewindui/Text';
import { MessageCircle } from 'lucide-react-native';
import { Button } from '@/components/nativewindui/Button';
import { router } from 'expo-router';

const Comment = ({ item }: { item: NDKEvent }) => {
    const { userProfile } = useUserProfile(item.pubkey);

    return (
        <View className="w-full flex-1 flex-row gap-2 p-4">
            <User.Avatar userProfile={userProfile} alt="Profile image" className="h-8 w-8" />

            <View className="flex-col">
                <View className="flex-row items-center gap-1">
                    <User.Name userProfile={userProfile} pubkey={item.pubkey} className="font-bold text-foreground" />
                    <RelativeTime timestamp={item.created_at} className="text-xs text-muted-foreground" />
                </View>

                <EventContent event={item} className="text-sm text-foreground" />
            </View>
        </View>
    )
}

export default function CommentScreen() {
    const activeEvent = useStore(activeEventStore, (state) => state.activeEvent);

    const filters = useMemo(
        () => [
            { kinds: [NDKKind.Text], ...activeEvent.filter() },
            { kinds: [1111], '#e': [activeEvent.id] },
        ],
        [activeEvent]
    );
    const opts = useMemo(() => ({ groupable: false, closeOnEose: false }), []);
    const { events } = useSubscribe({ filters, opts });

    return (
        <SafeAreaView className="flex-1 bg-card">
            {events.length === 0 && (
                <View style={{ flex: 1 }} className="items-center justify-center gap-4">
                    <MessageCircle size={Dimensions.get('window').width / 2} strokeWidth={1} color="gray" style={{ opacity: 0.5 }} />
                    <Text className="text-center text-xl text-muted-foreground">Be the first one to comment</Text>

                    <Button variant="tonal" onPress={() => router.push('/comment')} style={{ marginTop: 16 }}>
                        <Text>Add a comment</Text>
                    </Button>
                </View>
            )}
            <FlashList
                data={events}
                keyExtractor={(i) => i.id}
                estimatedItemSize={100}
                renderItem={({ item }) => <Comment item={item} />}
            />

            {/* <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="border-t border-border p-4">
                <View className="flex-row items-center gap-2">
                    <TextInput
                        placeholder="Add a comment..."
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        className="flex-1 rounded-full"
                    />
                    <Button disabled={!comment.trim()}>
                        <Text className="font-semibold">Post</Text>
                    </Button>
                </View>
            </KeyboardAvoidingView> */}
        </SafeAreaView>
    );
}
