import { useColorScheme } from "@/lib/useColorScheme";
import { View, Pressable, StyleSheet, Animated } from "react-native";
import CalendarButton from "./CalendarButton";
import Feed from "./Feed";
import NotificationsButton from "./NotificationsButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Zap } from "lucide-react-native";
import { NDKKind, NDKNutzap, useSubscribe, useNDKCurrentUser, useUserProfile, useNDKWallet, useNDKNutzapMonitor } from "@nostr-dev-kit/ndk-mobile";
import * as User from "@/components/ui/user";
import { formatMoney } from "@/utils/bitcoin";
import { Text } from "@/components/nativewindui/Text";
import { useState, useEffect } from "react";

export default function HomeHeader() {
    const insets = useSafeAreaInsets();
    const currentUser = useNDKCurrentUser();
    const [nutzap, setNutzap] = useState<NDKNutzap | null>(null);
    const animationProgress = useState(new Animated.Value(0))[0];
    const { events: nutzapEvents } = useSubscribe<NDKNutzap>( currentUser ? 
        [{
            kinds: [NDKKind.Nutzap],
            "#p": [currentUser?.pubkey],
            limit: 1
        }] : false, { wrap: true, groupable: false, closeOnEose: true }, [currentUser?.pubkey])

    useEffect(() => {
        Animated.timing(animationProgress, {
            toValue: nutzap ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [nutzap]);

    const incoming = () => {
        setNutzap(Array.from(nutzapEvents)?.[0]);
        setTimeout(() => setNutzap(null), 5000);
    }

    // const nutzap = Array.from(nutzapEvents)[0];

    const { nutzapMonitor } = useNDKNutzapMonitor();
    
    useEffect(() => {
        if (!nutzapMonitor) return;

        nutzapMonitor.on("seen", (nutzap) => {
            setNutzap(nutzap);
            setTimeout(() => setNutzap(null), 1500);
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
                        <Pressable onPress={incoming}>
                            <Zap size={24} color="white" />
                        </Pressable>
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
    const { colors } = useColorScheme();
    
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