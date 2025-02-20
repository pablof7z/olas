import { NDKEvent, NDKNutzap, NDKUser, useNDKCurrentUser, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { useMemo, useRef, useEffect, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import UserAvatar from "@/components/ui/user/avatar";
import { formatMoney } from "@/utils/bitcoin";
import { useColorScheme } from "@/lib/useColorScheme";
import { usePaymentStore } from "@/stores/payments";

export default function TopZaps({ target, zaps }: { target: NDKEvent | NDKUser, zaps: NDKNutzap[] }) {
    const id = target instanceof NDKEvent ? target.tagId() : target.pubkey;
    const pendingPayments = usePaymentStore(s => s.pendingPayments).get(id) || [];
    const currentUser = useNDKCurrentUser();
    const sortedZaps = useMemo(() => {
        const likeZapsPendingPayments = pendingPayments
            .map(p => {
                const likeZap = {
                    amount: p.zapper.amount / 1000,
                    pubkey: currentUser?.pubkey,
                    content: p.zapper.comment,
                }
                return likeZap;
            })
        return [...zaps, ...likeZapsPendingPayments]
            .sort((a, b) => b.amount - a.amount);
    }, [zaps, pendingPayments, currentUser]);

    // Animation values for container
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-20)).current;

    // Animate when component mounts
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    if (sortedZaps.length === 0) return null;

    return (
        <Animated.View style={[
            styles.container,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
            }
        ]}>
            {sortedZaps.length > 0 && (
                <ZapPill zap={sortedZaps[0]} />
            )}

            <View style={{ flex: 1 }} />

            {sortedZaps.slice(1, 3).map(zap => (
                <ZapPill zap={zap} withComment={false} />
            ))}
        </Animated.View>
    );
}

function ZapPill({ zap, withComment = true }: { zap: NDKNutzap, withComment?: boolean }) {
    const { userProfile } = useUserProfile(zap.pubkey);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(100)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <Animated.View style={[
            styles.pill,
            {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }]
            }
        ]}>
            <UserAvatar pubkey={zap.pubkey} userProfile={userProfile} imageSize={20} />
            {withComment && (
                <>
                    <Text className="text-xs font-bold">{formatMoney({ amount: zap.amount, unit: 'sats', hideUnit: true })}</Text>
                    <Text className="text-xs">{zap.content}</Text>
                </>
            )}
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
    }
});
