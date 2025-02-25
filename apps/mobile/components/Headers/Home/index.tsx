import { View, StyleSheet, Animated } from "react-native";
import CalendarButton from "./CalendarButton";
import Feed from "./Feed";
import NotificationsButton from "./NotificationsButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NDKNutzap, useUserProfile, useNDKNutzapMonitor } from "@nostr-dev-kit/ndk-mobile";
import * as User from "@/components/ui/user";
import { formatMoney } from "@/utils/bitcoin";
import { Text } from "@/components/nativewindui/Text";
import { useState, useEffect } from "react";
import AvatarGroup from "@/components/ui/user/AvatarGroup";

export default function HomeHeader() {
    const insets = useSafeAreaInsets();
    const [showZap, setShowZap] = useState(false);
    const [nutzaps, setNutzaps] = useState<NDKNutzap[]>([]);
    const animationProgress = useState(new Animated.Value(0))[0];

    useEffect(() => {
        Animated.timing(animationProgress, {
            toValue: showZap ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [showZap]);

    const { nutzapMonitor } = useNDKNutzapMonitor();
    
    useEffect(() => {
        if (!nutzapMonitor) return;

        nutzapMonitor.on("redeem", (nutzaps) => {
            setShowZap(true);
            setNutzaps(nutzaps);
            setTimeout(() => {
                setShowZap(false);
                setTimeout(() => setNutzaps([]), 1000);
            }, 1500);
        });
    }, [!!nutzapMonitor]);

    return (
        <View className="!bg-card border-b border-border pb-2" style={{ flexDirection: 'row', alignItems: 'center', paddingTop: insets.top + 10, width: '100%' }}>
            <Animated.View style={{
                transform: [{
                    translateY: animationProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -100]
                    })
                }],
                width: '100%',
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feed />

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <CalendarButton />
                        <NotificationsButton />
                    </View>
                </View>
            </Animated.View>

            <Animated.View style={{
                transform: [{
                    translateY: animationProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-100, 0]
                    })
                }],
                opacity: animationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1]
                }),
                position: 'absolute',
                width: '100%',
                zIndex: 2,
            }}>
                {nutzaps && <IncomingZap nutzaps={nutzaps} />}
            </Animated.View>
        </View>
    )
}

function IncomingZap({ nutzaps }: { nutzaps: NDKNutzap[] }) {
    const insets = useSafeAreaInsets();

    const avatarsSortedByAmount = nutzaps.sort((a, b) => b.amount - a.amount)
        .map(n => n.pubkey);
    const totalAmount = nutzaps.reduce((acc, n) => acc + n.amount, 0);
    
    return <View style={[zapNotificationStyle.container, { paddingTop: insets.top + 10 }]} className="pb-2">
        <AvatarGroup pubkeys={avatarsSortedByAmount} avatarSize={40} threshold={1} />

        {nutzaps.length === 1 && (
            <Text style={{ flex: 1 }}>
                {nutzaps.map(n => n.content).join(' ')}
            </Text>
        )}

        <Text style={[zapNotificationStyle.amount, { color: 'orange' }]}>
            {formatMoney({ amount: totalAmount })}
        </Text>
    </View>
}

const zapNotificationStyle = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
        paddingHorizontal: 10
    },
    amount: {
        fontSize: 24,
        fontWeight: 'bold',
    }
})