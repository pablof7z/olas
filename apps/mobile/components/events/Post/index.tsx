import {
    NDKEvent,
    NDKKind,
    useNDKWallet,
    useUserProfile,
} from '@nostr-dev-kit/ndk-mobile';
import { Dimensions, Pressable, Share, StyleSheet } from 'react-native';
import { View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import * as User from '@/components/ui/user';
import EventContent from '@/components/ui/event/content';
import RelativeTime from '@/app/components/relative-time';
import { Gesture, TouchableOpacity, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { memo, useMemo, useCallback, useEffect, useState } from 'react';
import { InlinedComments, Reactions } from './Reactions';
import FollowButton from '@/components/buttons/follow';
import { Text } from '@/components/nativewindui/Text';
import { Heart, MoreHorizontal, Repeat } from 'lucide-react-native';
import AvatarGroup from '@/components/ui/user/AvatarGroup';
import EventMediaContainer from '@/components/media/event';
import { optionsMenuEventAtom, optionsSheetRefAtom } from './store';
import { useAtomValue, useSetAtom } from 'jotai';
import { getClientName } from '@/utils/event';
import { useAppSettingsStore } from '@/stores/app';
import { activeEventAtom } from '@/stores/event';
import Lightning from "@/components/icons/lightning"
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSequence, 
    withTiming, 
    Easing,
} from 'react-native-reanimated';
import { useReactEvent } from '../React';
import { useReactionsStore } from '@/stores/reactions';
import TopZaps from './Reactions/TopZaps';
import { useZap } from '@/hooks/zap';

export const MediaSection = function MediaSection({ event, priority, onPress, maxHeight }: { priority?: 'low' | 'normal' | 'high', event: NDKEvent; onPress?: () => void, maxHeight: number }) {
    const {ndk} = useNDK();
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const [showHeart, setShowHeart] = useState(false);
    const [showZap, setShowZap] = useState(false);
    const zapScale = useSharedValue(0);
    const zapOpacity = useSharedValue(0);

    const animatedHeartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value
    }));

    const animatedZapStyle = useAnimatedStyle(() => ({
        transform: [{ scale: zapScale.value }],
        opacity: zapOpacity.value
    }));

    const triggerHeartAnimation = () => {
        scale.value = withSequence(
            withTiming(1.2, { duration: 100, easing: Easing.linear }),
            withTiming(0.9, { duration: 50 }),
            withTiming(1.1, { duration: 50 })
        );
        opacity.value = withSequence(
            withTiming(1, { duration: 50 }),      // Appear in 50ms
            withTiming(1, { duration: 250 }),     // Stay visible for 250ms
            withTiming(0, { duration: 200 })      // Fade out in 200ms
        );
    };

    const triggerZapAnimation = () => {
        zapScale.value = withSequence(
            withTiming(1.5, { duration: 50 }),
            withTiming(0.8, { duration: 50 }),
            withTiming(1.2, { duration: 50 })
        );
        zapOpacity.value = withSequence(
            withTiming(1, { duration: 50 }),
            withTiming(1, { duration: 250 }),
            withTiming(0, { duration: 200 })
        );
    };

    const { react } = useReactEvent();
    
    const handleDoubleTap = useCallback(() => {
        'worklet';
        setShowHeart(true);
        triggerHeartAnimation();
        react(event);
        setTimeout(() => setShowHeart(false), 500); // Total animation duration 50+250+200=500ms
    }, [event.id]);

    // default zap
    const defaultZap = useAppSettingsStore(s => s.defaultZap);

    const setActiveEvent = useSetAtom(activeEventAtom);
    
    const handleSingleTap = useCallback(() => {
        setTimeout(() => {
            setActiveEvent(event);
            router.push('/view');
        }, 100);
    }, [event.id]);

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .runOnJS(true)
        .onEnd(handleDoubleTap);

    const singleTapGesture = Gesture.Tap()
        .numberOfTaps(1)
        .runOnJS(true)
        .requireExternalGestureToFail(doubleTapGesture)
        .onEnd(handleSingleTap);

    const sendZap = useZap();

    const endSendZap = () => {
        'worklet';
        setShowZap(true);
        triggerZapAnimation();
        sendZap(defaultZap.message, defaultZap.amount, event);
        setTimeout(() => setShowZap(false), 500);
    }
        
    const handleLongPress = Gesture.LongPress()
        .runOnJS(true)
        .onStart(endSendZap);
    
    const combinedGesture = Gesture.Race(doubleTapGesture, handleLongPress, singleTapGesture);

    return (
        <GestureDetector gesture={combinedGesture}>
            <View style={{ flex: 1 }}>
                <EventMediaContainer
                    event={event}
                    onPress={onPress}
                    muted={true}
                    maxHeight={maxHeight}
                    priority={priority}
                />
                {showHeart && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                                  flex: 1, justifyContent: 'center', alignItems: 'center', 
                                  backgroundColor: '#00000044' }}>
                        <Animated.View style={animatedHeartStyle}>
                            <Heart size={96} color={'white'} fill={'white'} />
                        </Animated.View>
                    </View>
                )}
                {showZap && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                                  flex: 1, justifyContent: 'center', alignItems: 'center', 
                                  backgroundColor: '#00000044' }}>
                        <Animated.View style={animatedZapStyle}>
                            <Lightning size={96} color={'yellow'} fill={'orange'} />
                        </Animated.View>
                    </View>
                )}
            </View>
        </GestureDetector>
    );
}

export default function Post({ event, reposts, timestamp, index }: { index: number, event: NDKEvent; reposts: NDKEvent[]; timestamp: number }) {
    // console.log(`[${Date.now() - timeZero}ms]`+'render post', event.id)
    let content = event.content.trim();

    if (event.kind === NDKKind.Text) {
        // remove the urls from the content
        content = content.replace(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp|mp4|mov|avi|mkv)/g, '');
        // replace \n\n\n or more with \n
        content = content.replace(/\n\s*\n\s*\n+/g, '\n');
        // remove from content \n that are after the last word
        content = content.replace(/\n\s*$/g, '');
    }

    const priority = useMemo<('high' | 'normal' | 'low')>(() => {
        if (index === 0) return 'high';
        if (index <= 2) return 'normal';
        return 'low';
    }, [index])

    const { forceSquareAspectRatio } = useAppSettingsStore();

    const headerHeight = useHeaderHeight();
    const screen = Dimensions.get('window');
    const maxHeight = Math.floor(forceSquareAspectRatio ? screen.width * 1.1 : ((screen.height * 0.8) - headerHeight));

    return (
        <View className="overflow-hidden border-b border-border py-2">
            <PostHeader event={event} reposts={reposts} timestamp={timestamp} />

            <MediaSection event={event} priority={priority} maxHeight={maxHeight} />

            <PostBottom event={event} trimmedContent={content} />
        </View>
    );
}

export function PostHeader({ event, reposts, timestamp }: { event: NDKEvent; reposts: NDKEvent[]; timestamp: number }) {
    const { userProfile } = useUserProfile(event.pubkey);
    const { colors } = useColorScheme();
    const clientName = getClientName(event);

    const setOptionsMenuEvent = useSetAtom(optionsMenuEventAtom);
    const optionsSheetRef = useAtomValue(optionsSheetRefAtom);

    const openOptionsMenu = useCallback(() => {
        setOptionsMenuEvent(event);
        optionsSheetRef.current?.present();
    }, [event, optionsSheetRef]);

    return (
        <View className="flex-col p-2">
            {reposts.length > 0 && (
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <View className="w-full flex-row items-center justify-between gap-2 pb-0">
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            <Repeat size={16} color={'green'} />

                            <AvatarGroup pubkeys={reposts.map((r) => r.pubkey)} avatarSize={14} threshold={5} />

                            <Text className="text-xs text-muted-foreground">
                                {'Reposted '}
                                <RelativeTime timestamp={timestamp} />
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <View className="w-full flex-row items-center justify-between gap-2">
                <View style={styles.profileContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            router.push(`/profile?pubkey=${event.pubkey}`);
                        }}>
                        <User.Avatar pubkey={event.pubkey} userProfile={userProfile} imageSize={48} />
                    </TouchableOpacity>

                    <View className="flex-col">
                        <User.Name userProfile={userProfile} pubkey={event.pubkey} className="font-bold text-foreground" />
                        <Text>
                            <RelativeTime timestamp={event.created_at} className="text-xs text-muted-foreground" />
                            {clientName && (
                                <Text className="truncate text-xs text-muted-foreground" numberOfLines={1}>
                                    {` via ${clientName}`}
                                </Text>
                            )}
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <FollowButton pubkey={event.pubkey} />

                    <Pressable onPress={openOptionsMenu}>
                        <MoreHorizontal size={20} color={colors.foreground} />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const onMentionPress = (pubkey: string) => {
    router.push(`/profile?pubkey=${pubkey}`);
};

function PostBottom({ event, trimmedContent }: { event: NDKEvent; trimmedContent: string }) {
    // const tagsToRender = useMemo(() => {
    //     const tags = new Set(event.getMatchingTags('t').map(t => t[1]));
    //     // remove the tags that are already in the content
    //     tags.forEach(tag => {
    //         if (trimmedContent.match(new RegExp(`#${tag}`, 'i'))) tags.delete(tag);
    //     });
    //     return tags;
    // }, [event.id]);

    const setActiveEvent = useSetAtom(activeEventAtom);

    const showComment = useCallback(() => {
        setActiveEvent(event);
        router.push(`/comments`);
    }, [event, setActiveEvent]);

    const reactionStore = useReactionsStore(state => state.reactions);
    const reactions = useMemo(() => reactionStore?.get(event.id), [reactionStore, event.id]);

    const zapEvents = useMemo(() => {
        return reactions?.zapEvents ?? [];
    }, [reactions]);

    return (
        <View style={styles.postBottom}>
            <Reactions event={event} reactions={reactions} />

            {trimmedContent.length > 0 && (
                <Pressable onPress={showComment}>
                    <EventContent
                        event={event}
                        content={trimmedContent}
                        className="text-sm text-foreground"
                        onMentionPress={onMentionPress}
                    />
                </Pressable>
            )}

            {/* {tagsToRender.size > 0 && (
                <View className="flex-row flex-wrap gap-1">
                    <Text className="text-sm font-bold text-primary">
                        {`${Array.from(tagsToRender).map(t => `#${t}`).join(' ')}`}
                    </Text>
                </View>
            )} */}

            <TopZaps target={event} zaps={zapEvents} />

            <InlinedComments event={event} reactions={reactions} />
        </View>
    );
}

const styles = StyleSheet.create({
    postBottom: {
        flex: 1,
        flexDirection: 'column',
        gap: 10,
        padding: 10,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 2,
    }
});
