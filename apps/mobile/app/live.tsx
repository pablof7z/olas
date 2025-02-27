import { activeEventAtom } from "@/stores/event";
import { Stack } from "expo-router";
import { useVideoPlayer, VideoContentFit, VideoView } from "expo-video";
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Dimensions, NativeSyntheticEvent, Pressable, TextInputKeyPressEventData, View } from "react-native";
import { NDKEvent, type NDKUserProfile, useSubscribe, useNDKCurrentUser, useNDK, NDKKind } from "@nostr-dev-kit/ndk-mobile";
import { FlashList } from "@shopify/flash-list";
import EventContent from "@/components/ui/event/content";
import UserAvatar from "@/components/ui/user/avatar";
import UserName from "@/components/ui/user/name";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, { BottomSheetFlashList, BottomSheetFlatList, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { Fullscreen, MessageCircle, Send } from "lucide-react-native";
import { atom } from "jotai";
import { useUserProfile } from "@/hooks/user-profile";
import { BlurView } from "expo-blur";

type ReplyToAtom = {event: NDKEvent, profile: NDKUserProfile}

const replyToAtom = atom<ReplyToAtom | null, [ReplyToAtom], void>(null, (get, set, event) => {
    set(replyToAtom, event);
});

export default function LiveScreen() {
    const activeEvent = useAtomValue(activeEventAtom);
    let source = activeEvent?.tagValue?.('streaming');
    source ??= activeEvent?.tagValue?.('recording');
    const video = useVideoPlayer(source, (player) => {
        player.muted = false;
        player.play();
    });
    const title = activeEvent.tagValue('title');
    const [showChat, setShowChat] = useState(true);
    const headerHeight = useHeaderHeight();
    const [contentFit, setContentFit] = useState<VideoContentFit>('cover');
    const ref = useSheetRef();

    const insets = useSafeAreaInsets();
    const maxSize = Dimensions.get('window').height - insets.top - headerHeight - 100;

    useEffect(() => {
        if (!ref) return;

        ref.current?.present();
        ref.current?.snapToPosition(150);
    }, [ref])

    const onPress = () => {
        ref.current?.present();
        ref.current?.snapToPosition(maxSize)
        setShowChat(true);
    }

    const toggleContentFit = useCallback(() => {
        setContentFit(prev => (prev === 'cover' ? 'contain' : 'cover'));
    }, []);

    const screenOpts = useMemo(() => ({
        title,
        headerShown: true,
        headerTransparent: true,
        headerRight: () => <Pressable onPress={toggleContentFit}>
            <Fullscreen />
        </Pressable>
    }), [title, showChat, toggleContentFit])

    const style = useMemo(() => ({ width: '100%', height: '100%' }), [])

    if (!activeEvent) return null;

    return (<>
        <Stack.Screen options={screenOpts} />
        <View className="h-screen w-screen flex-1 flex-col">
            <Pressable onPress={() => !showChat && onPress}>
                <VideoView
                    player={video}
                    allowsPictureInPicture={true}
                    startsPictureInPictureAutomatically={true}
                    contentFit={contentFit}
                    nativeControls={false}
                    style={style}
                />
            </Pressable>

            <Sheet
                ref={ref}
                onChange={(e) => {if (e === -1) setShowChat(false)}}
                backdropComponent={null}
                backgroundStyle={{ borderWidth: 0, backgroundColor: '#000000bb' }}
                snapPoints={[150, '80%', maxSize]}
                style={{ borderWidth: 0 }}
                maxDynamicContentSize={maxSize}
            >
                <BottomSheetScrollView style={{ borderWidth: 0, flex: 1, paddingHorizontal: 10, paddingBottom: insets.bottom, minHeight: 500}}>
                    <Chat event={activeEvent} />
                </BottomSheetScrollView>
            </Sheet>

            {!showChat && (
                <View className="flex-1 h-screen w-screen absolute" style={{
                    marginTop: insets.top + headerHeight,
                    marginBottom: insets.bottom,
                }}>
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
    </>);
}

function ChatInput({ event }: { event: NDKEvent }) {
    const [ value, setValue ] = useState("");
    const currentUser = useNDKCurrentUser();
    const { ndk } = useNDK();
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const replyValue = useAtomValue(replyToAtom);
    const { event: replyTo, profile: replyToProfile } = replyValue ?? {};

    const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (e.nativeEvent.key === 'Enter') {
            onSubmit();
        }
    }

    const onSubmit = async () => {
        const chat = new NDKEvent(ndk);
        chat.content = value.trim();
        chat.kind = 1311;
        chat.tags.push(event.tagReference());
        await chat.sign();
        console.log(JSON.stringify(chat.rawEvent(), null, 2))
        chat.publish();
        setValue('');
    }   
    
    return (<View className="py-4 flex-row items-center w-full gap-4">
        <UserAvatar userProfile={userProfile} pubkey={currentUser?.pubkey} imageSize={24} />
        <View className="flex-col flex-1">
            {replyTo && <Text className="text-orange-500 text-xs">
                @{replyToProfile?.name}
            </Text>}
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
    </View>)
}

function Chat({ event }: { event: NDKEvent }) {
    const { events } = useSubscribe([
        { kinds: [1311 as NDKKind], ...event.filter() }
    ], { groupable: false, skipVerification: true }, [ event.tagId() ]);

    const filteredEvents = useMemo(() => 
        events.sort((a, b) => a.created_at! - b.created_at!)
    , [events.length])

    const flashListRef = useRef<FlashList<NDKEvent>>(null)

    useEffect(() => {
        if (flashListRef.current && filteredEvents.length > 0) {
            flashListRef.current.scrollToIndex({
                index: filteredEvents.length - 1,
                animated: true,
            })
        }
    }, [filteredEvents.length])

    return (
        <FlashList
            ref={flashListRef}
            data={filteredEvents}
            inverted
            ListFooterComponent={<ChatInput event={event} />}
            renderItem={({ item }) => <ChatItem event={item} />}
        />
    )
}

function ChatItem({ event }: { event: NDKEvent }) {
    const { userProfile } = useUserProfile(event.pubkey);
    const [ replyTo, setReplyTo ] = useAtom(replyToAtom);

    const onPress = () => {
        if (replyTo?.event?.id === event.id) {
            setReplyTo(null);
        } else {
            setReplyTo({ event, profile: userProfile });
        }
    }
    
    return <Pressable className="flex-row gap-2 flex-1 text-white my-1" onPress={onPress}>
        <UserAvatar pubkey={event.pubkey} userProfile={userProfile} imageSize={24} />
        <EventContent event={event} className="text-white text-base" />
    </Pressable>
}