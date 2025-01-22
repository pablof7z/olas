import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import * as User from '@/components/ui/user';
import { useUserProfile, useFollows } from '@nostr-dev-kit/ndk-mobile';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, useRef } from 'react';
import { useStore } from 'zustand';
import { NDKEvent, NDKFilter, NDKList, NDKSubscriptionCacheUsage, useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useSubscribe, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { MasonryFlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FollowButton from '@/components/buttons/follow';
import { EventMediaGridContainer } from '@/components/media/event';
import { useSetAtom } from 'jotai';
import { activeEventAtom } from '@/stores/event';

export default function Profile() {
    const follows = useFollows();
    const { pubkey } = useLocalSearchParams() as { pubkey: string };
    const { userProfile } = useUserProfile(pubkey);
    const scrollY = useRef(new Animated.Value(0)).current;
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const filters = useMemo(() => {
        const filters: NDKFilter[] = [
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
                <User.Avatar userProfile={userProfile} style={styles.profileImage} alt="Profile image" />
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
                <User.Avatar userProfile={userProfile} style={styles.smallProfileImage} alt="Profile image" />
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
                    <Text style={styles.username} className="text-foreground">
                        <User.Name userProfile={userProfile} pubkey={pubkey} />
                    </Text>
                    <Text style={styles.bio} className="text-muted-foreground">
                        <User.Field userProfile={userProfile} label="about" />
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
                    <View style={{ flex: 1, marginTop: 10 }}>
                        <MasonryFlashList
                            data={sortedContent}
                            numColumns={3}
                            estimatedItemSize={100}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingBottom: 60 }}
                            renderItem={({ item, index }) => (
                                <EventMediaGridContainer
                                    event={item}
                                    index={index}
                                    onPress={() => {
                                        setActiveEvent(item);
                                        router.push('/view');
                                    }}
                                />
                            )}
                        />
                    </View>
                )}
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        padding: 20,
        alignItems: 'center',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
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
    smallProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
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
