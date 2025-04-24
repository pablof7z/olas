import { type NDKEvent, NDKKind, useProfileValue } from '@nostr-dev-kit/ndk-mobile';
import { useHeaderHeight } from '@react-navigation/elements';
import { router } from 'expo-router';
import { useSetAtom } from 'jotai';
import { Heart } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
    Dimensions,
    Pressable,
    type StyleProp,
    StyleSheet,
    View,
    type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';

import { useReactEvent } from '../React';
import TopZaps from '../TopZaps';
import { PostHeader } from './Header';
import { InlinedComments, Reactions } from './Reactions';

import Lightning from '@/components/icons/lightning';
import EventMediaContainer from '@/components/media/event';
import { Text } from '@/components/nativewindui/Text';
import EventContent from '@/components/ui/event/content';
import { useZap } from '@/hooks/zap';
import { useCommentBottomSheet } from '@/lib/comments/bottom-sheet';
import { useColorScheme } from '@/lib/useColorScheme';
import { isUserProfileDeleted } from '@/lib/utils/user';
import { useAppSettingsStore } from '@/stores/app';
import { activeEventAtom } from '@/stores/event';
import { useReactionsStore } from '@/stores/reactions';

export const MediaSection = function MediaSection({
    event,
    priority,
    onPress,
    maxHeight,
}: {
    priority?: 'low' | 'normal' | 'high';
    event: NDKEvent;
    onPress?: () => void;
    maxHeight: number;
}) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const [showHeart, setShowHeart] = useState(false);
    const [showZap, setShowZap] = useState(false);
    const zapScale = useSharedValue(0);
    const zapOpacity = useSharedValue(0);

    const animatedHeartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const animatedZapStyle = useAnimatedStyle(() => ({
        transform: [{ scale: zapScale.value }],
        opacity: zapOpacity.value,
    }));

    const triggerHeartAnimation = () => {
        scale.value = withSequence(
            withTiming(1.2, { duration: 100, easing: Easing.linear }),
            withTiming(0.9, { duration: 50 }),
            withTiming(1.1, { duration: 50 })
        );
        opacity.value = withSequence(
            withTiming(1, { duration: 50 }), // Appear in 50ms
            withTiming(1, { duration: 250 }), // Stay visible for 250ms
            withTiming(0, { duration: 200 }) // Fade out in 200ms
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
    const defaultZap = useAppSettingsStore((s) => s.defaultZap);

    const setActiveEvent = useSetAtom(activeEventAtom);

    const handleSingleTap = useCallback(() => {
        setTimeout(() => {
            setActiveEvent(event);
            router.push('/view');
        }, 100);
    }, [event.id]);

    const doubleTapGesture = Gesture.Tap().numberOfTaps(2).runOnJS(true).onEnd(handleDoubleTap);

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
    };

    const handleLongPress = Gesture.LongPress().runOnJS(true).onStart(endSendZap);

    const combinedGesture = Gesture.Race(doubleTapGesture, handleLongPress, singleTapGesture);

    return (
        <GestureDetector gesture={combinedGesture}>
            <View style={{ flex: 1 }}>
                <EventMediaContainer
                    event={event}
                    onPress={onPress}
                    autoplay
                    muted
                    maxHeight={maxHeight}
                    priority={priority}
                />
                {showHeart && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#00000044',
                        }}
                    >
                        <Animated.View style={animatedHeartStyle}>
                            <Heart size={96} color="white" fill="white" />
                        </Animated.View>
                    </View>
                )}
                {showZap && (
                    <View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#00000044',
                        }}
                    >
                        <Animated.View style={animatedZapStyle}>
                            <Lightning size={96} color="yellow" fill="orange" />
                        </Animated.View>
                    </View>
                )}
            </View>
        </GestureDetector>
    );
};

export default function Post({
    event,
    reposts,
    timestamp,
    index,
}: {
    index: number;
    event: NDKEvent;
    reposts: NDKEvent[];
    timestamp: number;
}) {
    const userProfile = useProfileValue(event.pubkey, { subOpts: { skipVerification: true } });

    // console.log(`[${Date.now() - timeZero}ms]`+'render post', event.id)
    const priority = useMemo<'high' | 'normal' | 'low'>(() => {
        if (index === 0) return 'high';
        if (index <= 2) return 'normal';
        return 'low';
    }, [index]);

    const { forceSquareAspectRatio } = useAppSettingsStore();

    const headerHeight = useHeaderHeight();
    const screen = Dimensions.get('window');
    const maxHeight = Math.floor(
        forceSquareAspectRatio ? screen.width * 1.1 : screen.height * 0.8 - headerHeight
    );

    const { colors } = useColorScheme();

    const containerStyle = useMemo<StyleProp<ViewStyle>>(
        () => ({
            overflow: 'hidden',
            borderBottomWidth: 1,
            borderBottomColor: colors.grey5,
            paddingVertical: 10,
        }),
        []
    );

    if (isUserProfileDeleted(userProfile)) return null;

    return (
        <View style={containerStyle}>
            <PostHeader
                event={event}
                reposts={reposts}
                timestamp={timestamp}
                userProfile={userProfile}
            />

            <MediaSection event={event} priority={priority} maxHeight={maxHeight} />

            <PostBottom event={event} />
        </View>
    );
}

const onMentionPress = (pubkey: string) => {
    router.push(`/profile?pubkey=${pubkey}`);
};

function PostBottom({ event }: { event: NDKEvent }) {
    const trimmedContent = useMemo(() => {
        let content = event.content.trim();

        if (event.kind === NDKKind.Text) {
            // remove the urls from the content
            content = content.replace(
                /https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp|mp4|mov|avi|mkv)/g,
                ''
            );
            // replace \n\n\n or more with \n
            content = content.replace(/\n\s*\n\s*\n+/g, '\n');
            // remove from content \n that are after the last word
            content = content.replace(/\n\s*$/g, '');
        }

        return content;
    }, [event.content]);

    // const tagsToRender = useMemo(() => {
    //     const tags = new Set(event.getMatchingTags('t').map(t => t[1]));
    //     // remove the tags that are already in the content
    //     tags.forEach(tag => {
    //         if (trimmedContent.match(new RegExp(`#${tag}`, 'i'))) tags.delete(tag);
    //     });
    //     return tags;
    // }, [event.id]);

    const openComment = useCommentBottomSheet();
    const showComment = useCallback(() => {
        openComment(event);
    }, [event]);

    const reactions = useReactionsStore((state) => state.reactions.get(event.tagId()));

    return (
        <View style={styles.postBottom}>
            <Reactions event={event} reactions={reactions} />

            {trimmedContent.length > 0 && (
                <Pressable onPress={showComment}>
                    <EventContent
                        event={event}
                        numberOfLines={6}
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

            <TopZaps event={event} />

            <Pressable onPress={showComment}>
                <InlinedComments event={event} reactions={reactions} />
            </Pressable>
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
});
