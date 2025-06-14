import FollowButton from '@/components/buttons/follow';
import * as User from '@/components/ui/user';
import { useColorScheme } from '@/lib/useColorScheme';
import { useUserFlare } from '@/lib/user/hooks/flare';
import { prettifyNip05 } from '@/utils/user';
import { useEvent, useObserver } from '@nostr-dev-kit/ndk-hooks';
import { NDKKind, type NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { BlurView } from 'expo-blur';
import React, { memo, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import About from './About';
import Banner from './Banner';
import CopyToClipboard from './CopyToClipboard';
import Name from './Name';
import StoriesContainer from './StoriesContainer';

type ProfileHeaderProps = {
    pubkey: string;
    userProfile?: NDKUserProfile;
    flare?: string;
    colors: Record<string, string>;
    followCount: number;
    isExpanded: boolean;
    insets: { top: number };
};

const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 110;

const AnimatedAvatarContainer = Animated.createAnimatedComponent(View);
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const ProfileHeader = memo(({ pubkey, userProfile, colors, followCount, isExpanded, insets }: ProfileHeaderProps) => {
    const flare = useUserFlare(pubkey);
    // const followEvent = useEvent(
    //     [{ kinds: [NDKKind.Contacts], authors: [pubkey] }],
// Toggle-based animation logic
const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 110;
const AVATAR_MAX_SIZE = 90;
const AVATAR_MIN_SIZE = 36;

// Animation value: 1 = expanded, 0 = compact
const anim = useSharedValue(isExpanded ? 1 : 0);

useEffect(() => {
    anim.value = withTiming(isExpanded ? 1 : 0, { duration: 350 });
}, [isExpanded, anim]);

const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = Math.round(
        interpolate(
            anim.value,
            [0, 1],
            [HEADER_MIN_HEIGHT, HEADER_MAX_HEIGHT],
            Extrapolate.CLAMP
        )
    );
    const opacity = interpolate(
        anim.value,
        [0, 1],
        [0.2, 1],
        Extrapolate.CLAMP
    );
    return { height, overflow: 'hidden', opacity };
});

const avatarSize = useDerivedValue(() =>
    Math.round(
        interpolate(
            anim.value,
            [0, 1],
            [AVATAR_MIN_SIZE, AVATAR_MAX_SIZE],
            Extrapolate.CLAMP
        )
    )
);
const avatarAnimatedStyle = useAnimatedStyle(() => ({
    width: avatarSize.value,
    height: avatarSize.value,
    borderRadius: avatarSize.value / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -avatarSize.value / 2,
    marginBottom: 10,
}));
    //     { skipVerification: true },
    //     [pubkey]
    // );
    // const followCount = useMemo(() => {
    //     if (!followEvent) return 0;
    //     const followTags = followEvent.tags.filter((t: string[]) => t[0] === 'p');
    //     if (!followTags) return 0;
    //     return new Set(followTags.map((t: string[]) => t[1])).size;
    // }, [followEvent?.id]);
    // const olasPosts = useObserver(
    //     [
    //         { kinds: [20], authors: [pubkey] },
    //         { kinds: [1], '#k': ['20'], authors: [pubkey] },
    //     ],
    //     { skipVerification: true },
    //     [pubkey]
    // );

    // Toggle-based animation logic
    // (moved inside component to access anim)

    return (
        <Animated.View style={headerAnimatedStyle}>
            <AnimatedBlurView>
                <Banner pubkey={pubkey} />
            </AnimatedBlurView>
            <View style={[styles.header]}>
                <AnimatedAvatarContainer style={avatarAnimatedStyle}>
                    <User.Avatar
                        pubkey={pubkey}
                        userProfile={userProfile}
                        imageSize={AVATAR_MAX_SIZE}
                        flare={flare}
                        canSkipBorder
                        borderWidth={3}
                        skipProxy
                    />
                </AnimatedAvatarContainer>
                <View style={styles.statsContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <Name userProfile={userProfile} pubkey={pubkey} colors={colors} />
                            {userProfile?.nip05 && (
                                <Text style={{ color: colors.muted, fontSize: 12 }}>
                                    {prettifyNip05(userProfile?.nip05)}
                                </Text>
                            )}
                        </View>
                        <CopyToClipboard text={userProfile?.nip05 || pubkey} size={16} />
                    </View>
                </View>
                <FollowButton variant="secondary" pubkey={pubkey} size="sm" className="mx-4" />
            </View>
            <StoriesContainer pubkey={pubkey} />
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 20,
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 0,
        marginLeft: 16,
    },
    statItem: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    statNumber: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    statLabel: {
        fontSize: 12,
        color: 'gray',
    },
    bioSection: {
        marginHorizontal: 20,
        marginTop: 8,
    },
});

export default ProfileHeader;
