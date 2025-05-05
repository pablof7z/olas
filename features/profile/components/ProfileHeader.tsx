import FollowButton from '@/components/buttons/follow';
import * as User from '@/components/ui/user';
import { useColorScheme } from '@/lib/useColorScheme';
import { prettifyNip05 } from '@/utils/user';
import { useEvent, useObserver } from '@nostr-dev-kit/ndk-hooks';
import { NDKKind, type NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    useDerivedValue,
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
    scrollY: SharedValue<number>;
    insets: { top: number };
};

const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 100;

const AnimatedAvatarContainer = Animated.createAnimatedComponent(View);

const ProfileHeader = memo(
    ({ pubkey, userProfile, flare, colors, scrollY }: ProfileHeaderProps) => {
        const followEvent = useEvent(
            [{ kinds: [NDKKind.Contacts], authors: [pubkey] }],
            { skipVerification: true },
            [pubkey]
        );
        const followCount = useMemo(() => {
            if (!followEvent) return 0;
            const followTags = followEvent.tags.filter((t: string[]) => t[0] === 'p');
            if (!followTags) return 0;
            return new Set(followTags.map((t: string[]) => t[1])).size;
        }, [followEvent?.id]);
        const olasPosts = useObserver(
            [
                { kinds: [20], authors: [pubkey] },
                { kinds: [1], '#k': ['20'], authors: [pubkey] },
            ],
            { skipVerification: true },
            [pubkey]
        );

        // Animated styles using Reanimated
        const headerAnimatedStyle = useAnimatedStyle(() => {
            const height = interpolate(
                scrollY.value,
                [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
                [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
                Extrapolate.CLAMP
            );
            const opacity = interpolate(
                scrollY.value,
                [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
                [1, 0.2],
                Extrapolate.CLAMP
            );
            return { height, overflow: 'hidden', opacity };
        });

        // Animate avatar size with useAnimatedStyle
        const AVATAR_MAX_SIZE = 90;
        const AVATAR_MIN_SIZE = 36;
        const avatarSize = useDerivedValue(() =>
            interpolate(
                scrollY.value,
                [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
                [AVATAR_MAX_SIZE, AVATAR_MIN_SIZE],
                Extrapolate.CLAMP
            )
        );
        const avatarAnimatedStyle = useAnimatedStyle(() => ({
            width: avatarSize.value,
            height: avatarSize.value,
            borderRadius: avatarSize.value / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
        }));

        return (
            <Animated.View style={headerAnimatedStyle}>
                <Banner pubkey={pubkey} />
                <View style={[styles.header, { marginTop: -48, marginBottom: 10 }]}>
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
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber} className="text-foreground">
                                {olasPosts.length}
                            </Text>
                            <Text style={styles.statLabel} className="text-foreground">
                                Posts
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber} className="text-foreground">
                                {followCount}
                            </Text>
                            <Text style={styles.statLabel} className="text-foreground">
                                Following
                            </Text>
                        </View>
                    </View>
                    <FollowButton variant="secondary" pubkey={pubkey} size="sm" className="mx-4" />
                </View>
                <View style={styles.bioSection}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Name userProfile={userProfile} pubkey={pubkey} colors={colors} />
                        <CopyToClipboard text={userProfile?.nip05 || pubkey} size={16} />
                    </View>
                    {userProfile?.nip05 && (
                        <Text style={{ color: colors.muted, fontSize: 12 }}>
                            {prettifyNip05(userProfile?.nip05)}
                        </Text>
                    )}
                    <About userProfile={userProfile} colors={colors} />
                </View>
                <StoriesContainer pubkey={pubkey} />
            </Animated.View>
        );
    }
);

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
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
