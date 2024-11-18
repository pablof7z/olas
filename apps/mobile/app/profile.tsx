import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as User from '@/ndk-expo/components/user';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, useRef } from 'react';
import { useStore } from 'zustand';
import { NDKEvent, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { useSubscribe } from '@/ndk-expo';
import ImageCard from '@/components/events/ImageCard';
import { FlashList, MasonryFlashList } from '@shopify/flash-list';
import { activeEventStore } from './stores';

export default function Profile() {
    const { pubkey } = useLocalSearchParams() as { pubkey: string };
    const scrollY = useRef(new Animated.Value(0)).current;
    const filters = useMemo(
        () => [
            { kinds: [1063], '#m': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'], authors: [pubkey!] },
            { kinds: [NDKKind.HorizontalVideo, NDKKind.VerticalVideo, 20], authors: [pubkey!] },
            { kinds: [1], authors: [pubkey!], limit: 50 },
        ],
        []
    );
    const opts = useMemo(
        () => ({
            groupable: false,
            cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
        }),
        []
    );
    const { events } = useSubscribe({ filters, opts });

    if (!pubkey) {
        return null;
    }

    const FollowButton = () => {
        return (
            <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Follow</Text>
            </TouchableOpacity>
        );
    };

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

    return (
        <User.Profile pubkey={pubkey}>
            <View style={styles.container}>
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: headerOpacity,
                            transform: [{ translateY: headerTranslateY }],
                        },
                    ]}>
                    <User.Avatar style={styles.profileImage} alt="Profile image" />
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{events.length}</Text>
                            <Text style={styles.statLabel}>Posts</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>1.5K</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>890</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View className="flex-col items-center justify-between" style={[styles.compactHeader, { opacity: compactHeaderOpacity }]}>
                    <User.Avatar style={styles.smallProfileImage} alt="Profile image" />
                    <Text style={styles.username} className="grow text-lg font-bold">
                        <User.Name />
                    </Text>
                    <FollowButton />
                </Animated.View>

                <Animated.ScrollView
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                    scrollEventThrottle={16}>
                    <View style={styles.bioSection}>
                        <Text style={styles.username}>
                            <User.Name />
                        </Text>
                        <Text style={styles.bio}>
                            <User.Field label="about" />
                        </Text>
                    </View>

                    <FollowButton />

                    <MasonryFlashList
                        data={events}
                        numColumns={3}
                        estimatedItemSize={100}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <ImageGridItem event={item} />}
                    />
                </Animated.ScrollView>
            </View>
        </User.Profile>
    );
}

function ImageGridItem({ event }: { event: NDKEvent }) {
    let url = event.tagValue('thumb') || event.tagValue('url') || event.tagValue('u');
    const { setActiveEvent } = useStore(activeEventStore);

    // if this is a kind:1 see if there is a URL in the content that ends with .jpg, .jpeg, .png, .gif, .webp
    if (!url && event.kind === NDKKind.Text) {
        const content = event.content;
        const urlMatch = content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i);
        if (urlMatch) {
            url = urlMatch[0];
        }
    }

    if (!url) {
        return null;
    }

    return (
        <TouchableOpacity
            onPress={() => {
                setActiveEvent(event);
                router.push('/view');
            }}
            style={styles.gridItem}>
            <Image source={{ uri: url }} style={styles.gridImage} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#666',
    },
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
        aspectRatio: 1,
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
        backgroundColor: '#fff',
        zIndex: 1,
    },
    smallProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
});
