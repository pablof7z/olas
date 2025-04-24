import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import {
    NDKEvent,
    type NDKKind,
    type NDKUserProfile,
    useNDK,
    useNDKCurrentPubkey,
    useSubscribe,
    useProfileValue,
} from '@nostr-dev-kit/ndk-mobile';
import { useHeaderHeight } from '@react-navigation/elements';
import { FlashList } from '@shopify/flash-list';
import { Stack } from 'expo-router';
import { type VideoContentFit, VideoView, useVideoPlayer } from 'expo-video';
import { atom, useAtom, useAtomValue } from 'jotai';
import { Fullscreen, MessageCircle, Send } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    type NativeSyntheticEvent,
    Pressable,
    type TextInputKeyPressEventData,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import EventContent from '@/components/ui/event/content';
import UserAvatar from '@/components/ui/user/avatar';
import { activeEventAtom } from '@/stores/event';

type ReplyToAtom = { event: NDKEvent; profile: NDKUserProfile };

// Allow setting the atom to null
const replyToAtom = atom<ReplyToAtom | null, [ReplyToAtom | null], void>(null, (_get, set, value) => {
    set(replyToAtom, value);
});

export default function LiveScreen() {
    // Explicitly assert the type from the atom
    const activeEvent = useAtomValue(activeEventAtom) as NDKEvent | null;
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();
    const maxSize = Dimensions.get('window').height - insets.top - headerHeight - 100;
    const [showChat, setShowChat] = useState(true);
    const [contentFit, setContentFit] = useState<VideoContentFit>('cover');
    const ref = useSheetRef();
    
    // Ensure activeEvent is not null before accessing properties
    let source = activeEvent ? activeEvent.tagValue?.('streaming') : undefined;
    if (activeEvent && !source) {
        source = activeEvent.tagValue?.('recording');
    }
    // Ensure source is defined before using it
    const videoSource = source ? { uri: source } : undefined;
    
    // Initialize the video player hook unconditionally
    const video = useVideoPlayer(videoSource || { uri: '' }, (player) => {
        if (videoSource) {
            player.muted = false;
            player.play();
        }
    });
    
    const title = activeEvent?.tagValue('title');

    useEffect(() => {
        if (!ref) return;

        ref.current?.present();
        ref.current?.snapToPosition(150);
    }, [ref]);

    const onPress = () => {
        ref.current?.present();
        ref.current?.snapToPosition(maxSize);
        setShowChat(true);
    };

    const toggleContentFit = useCallback(() => {
        setContentFit((prev) => (prev === 'cover' ? 'contain' : 'cover'));
    }, []);

    const screenOpts = useMemo(
        () => ({
            title,
            headerShown: true,
            headerTransparent: true,
            headerRight: () => (
                <Pressable onPress={toggleContentFit}>
                    <Fullscreen />
                </Pressable>
            ),
        }),
        [title, toggleContentFit]
    );

    const style = useMemo(() => ({ width: '100%', height: '100%' }), []);

    // If no video source, don't render the player component
    if (!videoSource) {
        console.error("No video source found for live event.");
        // Optionally return a placeholder or error message component
        return <View><Text>Error: Video source not available.</Text></View>;
    }

    if (!activeEvent) return null;

    return (
        <>
            <Stack.Screen options={screenOpts} />
            <View className="h-screen w-screen flex-1 flex-col">
                <Pressable onPress={() => !showChat && onPress}>
                    {video && (
                        <VideoView
                            player={video}
                            allowsPictureInPicture
                            startsPictureInPictureAutomatically
                            contentFit={contentFit}
                            nativeControls={false}
                            style={style as any} // Cast to any as temporary workaround for style error
                        />
                    )}
                </Pressable>

                <Sheet
                    ref={ref}
                    onChange={(e) => {
                        if (e === -1) setShowChat(false);
                    }}
                    backdropComponent={null}
                    backgroundStyle={{ borderWidth: 0, backgroundColor: '#000000bb' }}
                    snapPoints={[150, '80%', maxSize]}
                    style={{ borderWidth: 0 }}
                    maxDynamicContentSize={maxSize}
                >
                    <BottomSheetScrollView
                        style={{
                            borderWidth: 0,
                            flex: 1,
                            paddingHorizontal: 10,
                            paddingBottom: insets.bottom,
                            minHeight: 500,
                        }}
                    >
                        {activeEvent && <Chat event={activeEvent} />}
                    </BottomSheetScrollView>
                </Sheet>

                {!showChat && (
                    <View
                        className="absolute h-screen w-screen flex-1"
                        style={{
                            marginTop: insets.top + headerHeight,
                            marginBottom: insets.bottom,
                        }}
                    >
                        <Pressable onPress={onPress}>
                            <MessageCircle size={24} color="white" />
                        </Pressable>
                    </View>
                )}

                {/* {showChat && (<View className="flex-1 h-screen w-screen absolute" style={{
                marginTop: insets.top + headerHeight,
                marginBottom: insets.bottom,
            }}>
                <Chat event={activeEvent} />
            </View>)} */}
            </View>
        </>
    );
}

function ChatInput({ event }: { event: NDKEvent }) {
    const [value, setValue] = useState('');
    const currentPubkey = useNDKCurrentPubkey();
    const { ndk } = useNDK();
    const userProfile = useProfileValue(currentPubkey || undefined, { subOpts: { skipVerification: true } });
    const replyValue = useAtomValue(replyToAtom);
    const { event: replyTo, profile: replyToProfile } = replyValue ?? {};

    const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (e.nativeEvent.key === 'Enter') {
            onSubmit();
        }
    };

    const onSubmit = async () => {
        if (!ndk) {
            console.error("NDK not available to send chat message.");
            // Optionally show a toast or error message
            return;
        }
        const chat = new NDKEvent(ndk);
        chat.content = value.trim();
        chat.kind = 1311;
        chat.tags.push(event.tagReference());
        await chat.sign();
        chat.publish();
        setValue('');
    };

    return (
        <View className="w-full flex-row items-center gap-4 py-4">
            {currentPubkey && (
                <UserAvatar userProfile={userProfile} pubkey={currentPubkey} imageSize={24} />
            )}
            <View className="flex-1 flex-col">
                {replyTo && (
                    <Text className="text-xs text-orange-500">@{replyToProfile?.name}</Text>
                )}
                <BottomSheetTextInput
                    value={value}
                    onChangeText={setValue}
                    multiline
                    placeholder="Say something..."
                    onKeyPress={onKeyPress}
                    style={{
                        flex: 1,
                        padding: 10,
                        borderRadius: 10,
                        color: 'white',
                    }}
                />
            </View>
            <Pressable onPress={onSubmit}>
                <Send size={18} color="white" />
            </Pressable>
        </View>
    );
}

function Chat({ event }: { event: NDKEvent }) {
    const { events } = useSubscribe(
        [{ kinds: [1311 as NDKKind], ...event.filter() }],
        { groupable: false, skipVerification: true },
        [event.tagId()]
    );

    const filteredEvents = useMemo(
        () => events.sort((a: NDKEvent, b: NDKEvent) => (a.created_at ?? 0) - (b.created_at ?? 0)), // Added types and null check for created_at
        [events.length]
    );

    const flashListRef = useRef<FlashList<NDKEvent>>(null);

    useEffect(() => {
        if (flashListRef.current && filteredEvents.length > 0) {
            flashListRef.current.scrollToIndex({
                index: filteredEvents.length - 1,
                animated: true,
            });
        }
    }, [filteredEvents.length]);

    return (
        <FlashList
            ref={flashListRef}
            data={filteredEvents}
            inverted
            ListFooterComponent={<ChatInput event={event} />}
            renderItem={({ item }) => <ChatItem event={item} />}
        />
    );
}

function ChatItem({ event }: { event: NDKEvent }) {
    const userProfile = useProfileValue(event.pubkey, { subOpts: { skipVerification: true } });
    const [replyTo, setReplyTo] = useAtom(replyToAtom);

    const onPress = () => {
        if (replyTo?.event?.id === event.id) {
            setReplyTo(null); // Remove cast, atom now accepts null
        } else {
            if (userProfile) { // Check if userProfile is defined
                setReplyTo({ event, profile: userProfile });
            } else {
                // Handle case where profile is not available, maybe show a message or don't set reply
                console.warn("Cannot set reply: User profile not found for", event.pubkey);
            }
        }
    };

    return (
        <Pressable className="my-1 flex-1 flex-row gap-2 text-white" onPress={onPress}>
            <UserAvatar pubkey={event.pubkey} userProfile={userProfile} imageSize={24} />
            <EventContent event={event} className="text-base text-white" />
        </Pressable>
    );
}
