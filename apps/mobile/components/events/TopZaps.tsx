import { NDKEvent, NDKNutzap, NDKUser, useNDKCurrentUser, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { useMemo, useRef, useEffect, useState } from "react";
import { View, StyleSheet, Animated, Pressable } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import UserAvatar from "@/components/ui/user/avatar";
import { formatMoney } from "@/utils/bitcoin";
import { useColorScheme } from "@/lib/useColorScheme";
import { Payment, targetToId, usePaymentStore } from "@/stores/payments";
import { colorWithOpacity } from "@/theme/colors";
import { router } from "expo-router";
import { activeEventAtom } from "@/stores/event";
import { useSetAtom } from "jotai";
import { useCommentBottomSheet } from "@/lib/comments/bottom-sheet";

export default function TopZaps({ event }: { event: NDKEvent | NDKUser }) {
    const id = targetToId(event);
    const paymentEntry = usePaymentStore(s => s.entries.get(id));

    const sortedZaps = useMemo(() => {
        return (paymentEntry?.payments ?? [])
            .sort((a, b) => b.amount - a.amount);
    }, [paymentEntry]);

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
                <ZapPill key={zap.internalId} zap={zap} withComment={false} />
            ))}
        </Animated.View>
    );
}

function ZapPill({ zap, withComment = true }: { zap: Payment, withComment?: boolean }) {
    const { userProfile } = useUserProfile(zap.sender);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(5)).current;  // Start scaled up 5x
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const { colors } = useColorScheme();

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                speed: 20,
                bounciness: 12,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ])
        ]).start();
    }, []);

    if (withComment) {
        return (
            <Animated.View style={[
                styles.pill,
                {
                    opacity: fadeAnim,
                    transform: [
                        { 
                            scale: scaleAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [5, 1]
                            })
                        },
                        { 
                            translateX: scaleAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [200, 0]
                            }) 
                        },
                        { 
                            rotate: rotateAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '15deg']
                            }) 
                        },
                    ],
                    backgroundColor: colorWithOpacity(colors.foreground, 0.1),
                    borderRadius: 100,
                    paddingVertical: 2,
                    paddingRight: 4,
                }
            ]}>
                <UserAvatar pubkey={zap.sender} userProfile={userProfile} imageSize={20} canSkipBorder={true} />
                <Text className="text-xs font-bold">{formatMoney({ amount: zap.amount, unit: zap.unit, hideUnit: true })}</Text>
                <Text className="text-xs">{zap.comment}</Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[
            styles.pill,
            {
                opacity: fadeAnim,
                transform: [{ translateX: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-200, 0]  // Adjust this value based on container width
                })}]
            }
        ]}>
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
    }
});
