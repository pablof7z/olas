import { type NDKNutzap } from '@nostr-dev-kit/ndk-mobile';
import { useAtomValue } from 'jotai';
import { Search, X } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    useAnimatedReaction,
    useSharedValue,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Feed from './Feed';
import NotificationsButton from './NotificationsButton';
import { searchQueryAtom, useSearchQuery } from './store';

import { searchInputRefAtom } from '@/components/FeedType/store';
import { Text } from '@/components/nativewindui/Text';
import AvatarGroup from '@/components/ui/user/AvatarGroup';
import { useColorScheme } from '@/lib/useColorScheme';
import { formatMoney } from '@/utils/bitcoin';

import { useScrollY } from '@/context/ScrollYContext';
import { useHeaderHeight } from '@react-navigation/elements';

export default function HomeHeader() {
    const scrollY = useScrollY();
    const insets = useSafeAreaInsets();
    const { colors } = useColorScheme();
    const headerHeight = useHeaderHeight();
    const setSearchQuery = useSearchQuery();
    const searchInputRef = useAtomValue(searchInputRefAtom);
    const searchQuery = useAtomValue(searchQueryAtom);
    const showSearchInput = useMemo(() => searchQuery !== null, [searchQuery]);

    const prevY = useSharedValue(0);
    const hidden = useSharedValue(false);
    const threshold = 50;

    useAnimatedReaction(
        () => scrollY.value,
        (current, previous) => {
            if (previous === undefined) {
                prevY.value = current;
                return;
            }
            const delta = current - prevY.value;
            if (delta > threshold) {
                hidden.value = true; // scrolled down
            } else if (-delta > threshold) {
                hidden.value = false; // scrolled up
            }
            prevY.value = current;
        },
        [scrollY]
    );

    const translateY = useDerivedValue(
        () => withTiming(hidden.value ? -(100 + insets.top) : 0, { duration: 200 }),
        [headerHeight, insets.top]
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // Animate header translateY based on scrollY
    const headerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [0, 100], [1, 0], Extrapolate.CLAMP);

        const translateY = interpolate(scrollY.value, [0, 100], [0, -100], Extrapolate.CLAMP);

        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    const toggleSearch = useCallback(() => {
        if (searchQuery !== null) {
            setSearchQuery(null);
            searchInputRef?.current?.blur();
        } else {
            setSearchQuery('');
            if (!showSearchInput) {
                searchInputRef?.current?.focus();
            }
        }
    }, [searchQuery, setSearchQuery, showSearchInput]);

    return (
        <Animated.View
            style={[
                styles.header,
                animatedStyle,
                {
                    backgroundColor: colors.card,
                    paddingTop: insets.top,
                },
            ]}
        >
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
                </View>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingBottom: 10,
    },
    searchButton: {
        paddingLeft: 10,
    },
});

function IncomingZap({ nutzaps }: { nutzaps: NDKNutzap[] }) {
    const insets = useSafeAreaInsets();

    const avatarsSortedByAmount = nutzaps.sort((a, b) => b.amount - a.amount).map((n) => n.pubkey);
    const totalAmount = nutzaps.reduce((acc, n) => acc + n.amount, 0);

    return (
        <View style={[zapNotificationStyle.container]} className="pb-2">
            <AvatarGroup pubkeys={avatarsSortedByAmount} avatarSize={40} threshold={1} />

            {nutzaps.length === 1 && (
                <Text style={{ flex: 1 }}>{nutzaps.map((n) => n.content).join(' ')}</Text>
            )}

            <Text style={[zapNotificationStyle.amount, { color: 'orange' }]}>
                {formatMoney({ amount: totalAmount })}
            </Text>
        </View>
    );
}

const zapNotificationStyle = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
        paddingBottom: 100,
    },
    amount: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});
