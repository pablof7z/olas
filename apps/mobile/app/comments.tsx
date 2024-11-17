import { TextInput } from "react-native-gesture-handler";
import { KeyboardAvoidingView, Platform } from "react-native";
import { router, Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Dimensions, View } from "react-native";
import { useNDK, useSubscribe } from "@/ndk-expo";
import * as User from '@/ndk-expo/components/user';
import { Text } from "@/components/nativewindui/Text";
import { Button } from "@/components/nativewindui/Button";
import { NDKEvent, NDKKind, NostrEvent } from "@nostr-dev-kit/ndk";
import { activeEventStore } from "./stores";
import { useStore } from "zustand";
import { FlashList } from "@shopify/flash-list";
import { LargeTitleHeader } from "@/components/nativewindui/LargeTitleHeader";
import EventContent from "@/ndk-expo/components/event/content";
import RelativeTime from "./components/relative-time";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CommentScreen() {
    const { ndk, currentUser } = useNDK();
    const [comment, setComment] = useState('');
    const activeEvent = useStore(activeEventStore, (state) => state.activeEvent);

    const filters = useMemo(() => [
        { kinds: [ NDKKind.Text ], ...activeEvent.filter() },
        { kinds: [ 1111 ], "#e": [activeEvent.id], }
    ], [activeEvent]);
    const opts = useMemo(() => ({ groupable: false, closeOnEose: false }), []);
    const { events } = useSubscribe({ filters, opts });

    

    return (
        <SafeAreaView className="flex-1 bg-card">
            <FlashList
                data={events}
                keyExtractor={i => i.id}
                estimatedItemSize={100}
                renderItem={({item}) => (
                    <View className="flex-1 w-full p-4 flex-row gap-2">
                        <User.Profile pubkey={item.pubkey}>
                            <User.Avatar alt="Profile image" className="w-8 h-8" />
                            
                            <View className="flex-col">
                                <View className="flex-row items-center gap-1">
                                    <User.Name className="font-bold" />
                                    <RelativeTime timestamp={item.created_at} className="text-xs text-muted-foreground" />
                                </View>
                                
                                <EventContent event={item} className="text-sm" />
                            </View>
                        </User.Profile>
                    </View>
                )}
            />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="border-t border-border p-4"
            >
                <View className="flex-row items-center gap-2">
                    <TextInput
                        placeholder="Add a comment..."
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        className="flex-1 rounded-full"
                    />
                    <Button
                        disabled={!comment.trim()}
                    >
                        <Text className="font-semibold">Post</Text>
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
