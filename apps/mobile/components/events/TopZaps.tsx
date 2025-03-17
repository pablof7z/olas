import { NDKEvent, NDKUser, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withSequence,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { Text } from '@/components/nativewindui/Text';
import UserAvatar from '@/components/ui/user/avatar';
import { formatMoney } from '@/utils/bitcoin';
import { useColorScheme } from '@/lib/useColorScheme';
import { Payment, targetToId, usePaymentStore } from '@/stores/payments';
import { colorWithOpacity } from '@/theme/colors';

export default function TopZaps({ event }: { event: NDKEvent | NDKUser }) {
    const id = targetToId(event);
    const paymentEntry = usePaymentStore((s) => s.entries.get(id));

    const sortedZaps = useMemo(() => {
        return (paymentEntry?.payments ?? []).sort((a, b) => b.amount - a.amount);
    }, [paymentEntry]);

    // Animation values for container
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(-20);

    // Animate when component mounts
    useEffect(() => {
        opacity.value = withTiming(1, { duration: 500 });
        translateY.value = withTiming(0, { duration: 500 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });

    if (sortedZaps.length === 0) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            {sortedZaps.length > 0 && <ZapPill zap={sortedZaps[0]} />}

            <View style={{ flex: 1 }} />

            {sortedZaps.slice(1, 3).map((zap) => (
                <ZapPill key={zap.internalId} zap={zap} withComment={false} />
            ))}
        </Animated.View>
    );
}

function ZapPill({ zap, withComment = true }: { zap: Payment; withComment?: boolean }) {
    const { userProfile } = useUserProfile(zap.sender);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(5); // Start scaled up 5x
    const rotate = useSharedValue(0);

    const { colors } = useColorScheme();

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 500 });
        scale.value = withSpring(1, { damping: 12, stiffness: 100 });
        rotate.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 300 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: withComment
                ? [
                      { scale: scale.value },
                      { translateX: interpolate(scale.value, [5, 1], [200, 0], Extrapolate.CLAMP) },
                      { rotate: `${interpolate(rotate.value, [0, 1], [0, 15], Extrapolate.CLAMP)}deg` },
                  ]
                : [{ translateX: interpolate(scale.value, [5, 1], [-200, 0], Extrapolate.CLAMP) }],
        };
    });

    if (withComment) {
        return (
            <Animated.View
                style={[
                    styles.pill,
                    animatedStyle,
                    {
                        backgroundColor: colorWithOpacity(colors.foreground, 0.1),
                        borderRadius: 100,
                        paddingVertical: 2,
                        paddingRight: 4,
                    },
                ]}>
                <UserAvatar pubkey={zap.sender} userProfile={userProfile} imageSize={20} canSkipBorder={true} />
                <Text className="text-xs font-bold">{formatMoney({ amount: zap.amount, unit: zap.unit, hideUnit: true })}</Text>
                <Text className="text-xs">{zap.comment}</Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[styles.pill, animatedStyle]}>
            <UserAvatar pubkey={zap.sender} userProfile={userProfile} imageSize={20} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
