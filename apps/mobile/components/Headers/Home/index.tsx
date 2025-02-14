import { View, Pressable, StyleSheet, Animated } from "react-native";
import CalendarButton from "./CalendarButton";
import Feed from "./Feed";
import NotificationsButton from "./NotificationsButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NDKKind, NDKNutzap, useSubscribe, useNDKCurrentUser, useUserProfile, useNDKWallet, useNDKNutzapMonitor } from "@nostr-dev-kit/ndk-mobile";
import * as User from "@/components/ui/user";
import { formatMoney } from "@/utils/bitcoin";
import { Text } from "@/components/nativewindui/Text";
import { useState, useEffect } from "react";

export default function HomeHeader() {
    const insets = useSafeAreaInsets();
    const [showZap, setShowZap] = useState(false);
    const [nutzap, setNutzap] = useState<NDKNutzap | null>(null);
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

        nutzapMonitor.on("seen", (nutzap) => {
            setShowZap(true);
            setNutzap(nutzap);
            setTimeout(() => {
                setShowZap(false);
                setTimeout(() => setNutzap(null), 1000);
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
                {nutzap && <IncomingZap nutzap={nutzap} />}
            </Animated.View>
        </View>
    )
}

function IncomingZap({ nutzap }: { nutzap: NDKNutzap }) {
    const insets = useSafeAreaInsets();
    const { userProfile } = useUserProfile(nutzap.pubkey);
    
    return <View style={[zapNotificationStyle.container, { paddingTop: insets.top + 10 }]} className="pb-2">
        <User.Avatar pubkey={nutzap.pubkey} userProfile={userProfile} imageSize={40} />

        <Text style={{ flex: 1 }}>
            {nutzap.content}
        </Text>

        <Text style={[zapNotificationStyle.amount, { color: 'orange' }]}>
            {formatMoney({ amount: nutzap.amount, unit: nutzap.unit })}
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