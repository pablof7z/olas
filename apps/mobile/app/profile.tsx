import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform, Linking, Pressable } from 'react-native';
import * as User from '@/components/ui/user';
import { useUserProfile, useFollows } from '@nostr-dev-kit/ndk-mobile';
import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, useRef, useCallback } from 'react';
import { useStore } from 'zustand';
import { NDKEvent, NDKFilter, NDKList, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk-mobile';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useSubscribe, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { MasonryFlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FollowButton from '@/components/buttons/follow';
import { EventMediaGridContainer } from '@/components/media/event';
import { useSetAtom } from 'jotai';
import { activeEventAtom } from '@/stores/event';
import EventContent from '@/components/ui/event/content';
import { Check, Copy } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import Feed from '@/components/Feed';

function CopyToClipboard({ text, size = 16 }: { text: string; size?: number }) {
    const { colors } = useColorScheme();
    const [copied, setCopied] = useState(false);
    const copy = useCallback(() => {
        Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => { setCopied(false); }, 2000);
    }, [text]);

    return (
        <Pressable onPress={copy} style={{ marginLeft: 4 }}>
            {copied ? (
                <Check size={size} color={colors.muted} />
            ) : (
                <Copy size={size} color={colors.muted} />
            )}
        </Pressable>
    );
}

export default function Profile() {
    const follows = useFollows();
    const { pubkey } = useLocalSearchParams() as { pubkey: string };
    const { ndk } = useNDK();
    const user = ndk.getUser({ pubkey });
    const { userProfile } = useUserProfile(pubkey);
    const scrollY = useRef(new Animated.Value(0)).current;
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const filters = useMemo(() => {
        const filters: NDKFilter[] = [
            // { kinds: [30018, 30402], authors: [pubkey!] },
            { kinds: [NDKKind.HorizontalVideo, NDKKind.VerticalVideo, NDKKind.Image], authors: [pubkey!] },
            { kinds: [NDKKind.Text], '#k': ['20'], authors: [pubkey!] },
            { kinds: [NDKKind.Contacts], authors: [pubkey!] },
        ];

        if (filtersExpanded) {
            filters.push({ kinds: [1], authors: [pubkey!], limit: 50 });
        }

        return filters;
    }, [filtersExpanded, pubkey]);
    const opts = useMemo(() => ({ groupable: false, cacheUsage: NDKSubscriptionCacheUsage.PARALLEL }), []);
    const { events } = useSubscribe(filters, opts, [pubkey, filters.length]);

    const followCount = useMemo(() => {
        const contacts = events.find((e) => e.kind === NDKKind.Contacts);
        if (!contacts) return 0;
        const followTags = contacts.tags.filter((t) => t[0] === 'p');
        if (!followTags) return 0;
        return new Set(followTags.map((t) => t[1])).size;
    }, [events]);

    const sortedContent = useMemo(() => {
        return events.filter((e) => [NDKKind.Text, NDKKind.Image, NDKKind.VerticalVideo].includes(e.kind)).sort((a, b) => b.created_at - a.created_at);
    }, [events]);

    if (!pubkey) {
        return null;
    }

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, -120], // adjust based on difference between header heights
        extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const compactHeaderOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    function expandFilters() {
        setFiltersExpanded(true);
    }

    const setActiveEvent = useSetAtom(activeEventAtom);

    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: headerOpacity,
                        transform: [{ translateY: headerTranslateY }],
                    },
                ]}>
                <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={80} />
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber} className="text-foreground">
                            {sortedContent.length}
                        </Text>
                        <Text style={styles.statLabel} className="text-foreground">
                            Posts
                        </Text>
                    </View>
                    {/* <View style={styles.statItem}>
                        <Text style={styles.statNumber} className="text-foreground">
                            N/A
                        </Text>
                        <Text style={styles.statLabel} className="text-foreground">
                            Followers
                        </Text>
                    </View> */}
                    {followCount ? (
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber} className="text-foreground">
                                {followCount}
                            </Text>
                            <Text style={styles.statLabel} className="text-foreground">
                                Following
                            </Text>
                        </View>
                    ) : null}
                </View>
            </Animated.View>

            <Animated.View style={[styles.compactHeader, { opacity: compactHeaderOpacity }]}>
                <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={40} />
                <Text style={styles.username} className="grow text-lg font-bold text-foreground">
                    <User.Name userProfile={userProfile} pubkey={pubkey} />
                </Text>
                <FollowButton pubkey={pubkey} />
            </Animated.View>

            <Animated.ScrollView
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                    useNativeDriver: true,
                })}
                scrollEventThrottle={16}>
                <View style={styles.bioSection}>
                    <View className="text-foreground flex-row gap-4 items-center">
                        <Text style={styles.username} className="text-foreground ">
                            <User.Name userProfile={userProfile} pubkey={pubkey} />
                        </Text>

                        <CopyToClipboard text={user.npub} size={16} />
                    </View>
                    <Text style={styles.bio} className="text-muted-foreground">
                        {userProfile?.about ? <EventContent content={userProfile.about} /> : null}
                    </Text>
                </View>

                {!follows?.includes(pubkey) && (
                    <View style={{ padding: 20 }}>
                        <FollowButton variant="primary" pubkey={pubkey} size="sm" className="mx-4" />
                    </View>
                )}

                {events.length === 0 ? (
                    <View style={styles.noEventsContainer}>
                        <Text style={styles.noEventsText}>No posts yet</Text>

                        {!filtersExpanded && (
                            <TouchableOpacity style={styles.browseButton} onPress={expandFilters}>
                                <Text style={styles.browseButtonText}>Browse tweet images</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <Feed
                        filters={filters}
                        filterKey="1"
                        numColumns={3}
                    />
                )}
            </Animated.ScrollView>
        </View>
    );
}

// function Products({ pubkey }: { pubkey: string }) {
//     const { ndk } = useNDK();
//     const { events } = useSubscribe([{ kinds: [30402], authors: [pubkey] }], { groupable: false, cacheUsage: NDKSubscriptionCacheUsage.PARALLEL }, [pubkey]);

//     const firstProduct = useMemo(() => { return events[0]; }, [events?.[0]?.id]);

//     return <View>
//         <Text>Products {events.length}</Text>
//         <Text>{firstProduct?.content}</Text>
//     </View>
// }

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: 40,
        paddingHorizontal: 40,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {},
    bioSection: {
        paddingHorizontal: 20,
    },
    username: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    bio: {
        marginTop: 4,
    },
    editButton: {
        margin: 20,
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#dbdbdb',
        alignItems: 'center',
    },
    editButtonText: {
        fontWeight: '600',
    },
    gridItem: {
        width: Dimensions.get('window').width / 3,
        height: Dimensions.get('window').width / 3,
        backgroundColor: '#eee',
        margin: 1,
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    compactHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 1,
    },
    noEventsText: {
        textAlign: 'center',
        color: '#666',
        padding: 20,
        fontSize: 16,
    },
    noEventsContainer: {
        alignItems: 'center',
        padding: 20,
    },
    browseButton: {
        marginTop: 12,
        padding: 10,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    browseButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
