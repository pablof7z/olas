import { View, StyleSheet, Pressable } from "react-native";
import Animated, { SlideOutUp, useSharedValue, withTiming, useAnimatedStyle, FadeIn } from "react-native-reanimated";
import Feed from "./Feed";
import NotificationsButton from "./NotificationsButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NDKNutzap, useNDKNutzapMonitor } from "@nostr-dev-kit/ndk-mobile";
import { formatMoney } from "@/utils/bitcoin";
import { Text } from "@/components/nativewindui/Text";
import { useState, useEffect, useCallback, useMemo } from "react";
import AvatarGroup from "@/components/ui/user/AvatarGroup";
import { useAtomValue } from "jotai";
import { FadeOut } from "react-native-reanimated";
import { scrollDirAtom } from "@/components/Feed/store";
import { useColorScheme } from "@/lib/useColorScheme";
import { Search, Sun, X } from "lucide-react-native";
import { searchQueryAtom, useSearchQuery } from "./store";
import { searchInputRefAtom } from "@/components/FeedType/store";
import { router } from "expo-router";
export default function HomeHeader() {
    const insets = useSafeAreaInsets();
    const [showZap, setShowZap] = useState(false);
    const [nutzaps, setNutzaps] = useState<NDKNutzap[]>([]);
    const animationProgress = useSharedValue(0);
    const headerAnim = useSharedValue(0);
    const scrollDir = useAtomValue(scrollDirAtom);

    useEffect(() => {
        headerAnim.value = withTiming(scrollDir === 'up' ? 0 : 1, { duration: 200 });
    }, [scrollDir]);

    useEffect(() => {
        headerAnim.value = withTiming(showZap ? 1 : 0, { duration: 300 });
    }, [showZap]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{
            translateY: headerAnim.value * -100
        }]
    }));

    const zapStyle = useAnimatedStyle(() => ({
        transform: [{
            translateY: animationProgress.value * -100
        }],
        opacity: animationProgress.value
    }));

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

    const { colors } = useColorScheme();
    const setSearchQuery = useSearchQuery();
    const searchInputRef = useAtomValue(searchInputRefAtom);
    const searchQuery = useAtomValue(searchQueryAtom);
    const showSearchInput = useMemo(() => (searchQuery !== null), [searchQuery])

    const toggleSearch = useCallback(() => {
        if (searchQuery !== null) {
            setSearchQuery(null);
            searchInputRef?.current?.blur();
        } else {
            setSearchQuery("");
            if (!showSearchInput) {
                searchInputRef?.current?.focus();
            }
        }
    }, [searchQuery, setSearchQuery, showSearchInput])

    return (
        <Animated.View style={[
            styles.header,
            containerStyle,
            { backgroundColor: colors.card }
        ]}>
            {!nutzaps.length ? (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={{ width: '100%', marginTop: insets.top }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feed />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Pressable style={styles.searchButton} onPress={toggleSearch}>
                                {showSearchInput ? (
                                    <X size={24} color={colors.foreground} />
                                ) : (
                                    <Search size={24} color={colors.foreground} />
                                )}
                            </Pressable>
                            <NotificationsButton />
                            <Pressable onPress={() => router.push('/everything')}>
                                <Sun size={24} color={colors.foreground} />
                            </Pressable>
                        </View>
                    </View>
                </Animated.View>
            ) : (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={[zapStyle, {
                    width: '100%',
                    marginTop: insets.top   
                }]}>
                    {nutzaps && <IncomingZap nutzaps={nutzaps} />}
                </Animated.View>
            )}
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '100%',
        paddingBottom: 10
    },
    searchButton: {
        paddingLeft: 10,
    },
});

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
        paddingBottom: 100
    },
    amount: {
        fontSize: 24,
        fontWeight: 'bold',
    }
})