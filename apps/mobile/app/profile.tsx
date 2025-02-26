import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform, Linking, Pressable } from 'react-native';
import * as User from '@/components/ui/user';
import { NDKCacheAdapterSqlite, NDKUser, NDKUserProfile, useFollows } from '@nostr-dev-kit/ndk-mobile';
import ReelIcon from '@/components/icons/reel';
import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { NDKEvent, NDKFilter, NDKList, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk-mobile';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useSubscribe, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FollowButton from '@/components/buttons/follow';
import { Image } from 'expo-image';
import EventContent from '@/components/ui/event/content';
import { ArrowLeft, Check, Copy, Grid, ShoppingBag, ShoppingCart, Video, Wind } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import Feed from '@/components/Feed';
import { useUserProfile } from '@/hooks/user-profile';
import { useUserFlare } from '@/hooks/user-flare';
import { BlurView } from 'expo-blur';
import { useObserver } from '@/hooks/observer';
import EventMediaContainer from '@/components/media/event';
import { prettifyNip05 } from '@/utils/user';
import { atom, useAtom, useSetAtom } from 'jotai';
import { imageOrVideoUrlRegexp } from '@/utils/media';
import { FeedEntry } from '@/components/Feed/hook';
import { SHOP_ENABLED } from '@/utils/const';
import { FlashList } from '@shopify/flash-list';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);


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


function Header({ user, pubkey, userProfile, scrollY }: { user: NDKUser, pubkey: string, userProfile: NDKUserProfile, scrollY: Animated.Value }) {
    const { colors } = useColorScheme();
    const insets = useSafeAreaInsets();
    const bannerHeight = insets.top + headerStyles.leftContainer.height + 50;
    
    // Create a new Animated.Value for blur intensity
    const defaultBlurValue = new Animated.Value(0);
    
    // Use the scrollY value if available, otherwise use the default
    const blurIntensity = scrollY ? scrollY.interpolate({
        inputRange: [0, bannerHeight / 2, bannerHeight],
        outputRange: [0, 0, 100],
        extrapolate: 'clamp'
    }) : defaultBlurValue;
    
    // Create opacity animation for the username
    const usernameOpacity = scrollY ? scrollY.interpolate({
        inputRange: [0, bannerHeight / 2, bannerHeight],
        outputRange: [0, 0.5, 1],
        extrapolate: 'clamp'
    }) : defaultBlurValue;
    
    return (
        <AnimatedBlurView 
            intensity={blurIntensity} 
            style={[headerStyles.container, { paddingTop: insets.top }]}>
            <View style={headerStyles.leftContainer}>
                <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 10, backgroundColor: '#00000055', borderRadius: 100, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 }}>
                    <ArrowLeft size={24} color={"white"} />
                </TouchableOpacity>

                <Animated.View style={{ flexDirection: 'row', alignItems: 'center', opacity: usernameOpacity }}>
                    <Pressable onPress={() => router.back()} style={{ flexDirection: 'column' }}>
                        <User.Name userProfile={userProfile} pubkey={pubkey} style={{ color: colors.foreground, fontSize: 20, fontWeight: 'bold' }} />
                        {userProfile?.nip05 && (
                            <Text style={{ color: colors.muted, fontSize: 12 }}>{prettifyNip05(userProfile?.nip05)}</Text>
                        )}
                    </Pressable>
                    <CopyToClipboard text={userProfile?.nip05 || user.npub} size={16} />
                </Animated.View>
            </View>

            <Animated.View style={{ flexDirection: 'row', alignItems: 'center', opacity: usernameOpacity }}>
                <FollowButton variant="secondary" pubkey={pubkey} size="sm" className="mx-4" />
            </Animated.View>
        </AnimatedBlurView>
    )
}

const headerStyles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftContainer: {
        height: 45,
        paddingBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default function Profile() {
    const { pubkey, view } = useLocalSearchParams() as { pubkey: string, view?: string };
    const { ndk } = useNDK();
    const user = ndk.getUser({ pubkey });
    const { userProfile } = useUserProfile(pubkey);
    const flare = useUserFlare(pubkey);
    const scrollY = useRef(new Animated.Value(0)).current;
    const { events } = useSubscribe([
        { kinds: [NDKKind.Image, NDKKind.VerticalVideo], authors: [pubkey] },
        { kinds: [NDKKind.Text], '#k': ['20'], authors: [pubkey] },
        { kinds: [NDKKind.Contacts], authors: [pubkey] },
    ], undefined, [pubkey])

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

    const insets = useSafeAreaInsets();
    const {colors} = useColorScheme();
    const setView = useSetAtom(profileContentViewAtom);

    useEffect(() => {
        if (view) {
            setView(view);
        }
    }, [view])
    
    if (!pubkey) {
        return null;
    }
    
    
    return (
        <>
            <Stack.Screen options={{
                headerShown: true,
                headerTransparent: true,
                header: () => <Header user={user} pubkey={pubkey} userProfile={userProfile} scrollY={scrollY} />
            }} />
            <View style={[styles.container]}>
                <Animated.ScrollView
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={16}
                >
                    {userProfile?.banner ? (
                        <Image source={{ uri: userProfile.banner }} style={{ width: '100%', height: insets.top + headerStyles.leftContainer.height + 50 }} />
                    ) : (
                        <View style={{ width: '100%', height: insets.top + headerStyles.leftContainer.height + 50, backgroundColor: `#${user.pubkey.slice(0, 6)}` }} />
                    )}
                    <View style={[ styles.header, { marginTop: -20 } ]}>
                        <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={90} flare={flare} canSkipBorder={true} />
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

                        <FollowButton variant="secondary" pubkey={pubkey} size="sm" className="mx-4" />
                    </View>

                    <View style={styles.bioSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <User.Name userProfile={userProfile} pubkey={pubkey} style={{ color: colors.foreground, fontSize: 16, fontWeight: 'bold' }} />
                            <CopyToClipboard text={userProfile?.nip05 || user.npub} size={16} />
                        </View>
                        {userProfile?.nip05 && (
                            <Text style={{ color: colors.muted, fontSize: 12 }}>{prettifyNip05(userProfile?.nip05)}</Text>
                        )}
                        <Text style={styles.bio} className="text-muted-foreground">
                            {userProfile?.about ? <EventContent content={userProfile.about} /> : null}
                        </Text>
                    </View>

                    <StoriesContainer pubkey={pubkey} />

                    <ProfileContent pubkey={pubkey} />
                </Animated.ScrollView>
            </View>
        </>
    );
}

function StoriesContainer({ pubkey }: { pubkey: string }) {
    const latestOlas365 = useObserver([
        { "#t": ["olas365"], authors: [pubkey], limit: 1 },
    ], { wrap: true, cacheUnconstrainFilter: []}, [pubkey])
    const setView = useSetAtom(profileContentViewAtom);

    if (!latestOlas365.length) return null;

    return <View style={{ flex: 1, margin: 20, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onPress={() => setView('olas365')}>
            <View style={{ flexDirection: 'row', gap: 10, width: 40, height: 40, borderRadius: 40, overflow: 'hidden' }}>
                <EventMediaContainer
                    event={latestOlas365[0]}
                    width={40}
                    className="rounded-lg"
                    singleMode
                    onPress={() => setView('olas365')}
                    height={40}
                contentFit="cover"
                maxWidth={Dimensions.get('window').width}
                maxHeight={Dimensions.get('window').width}
                    priority="high"
                />
            </View>

            <Text style={{ fontSize: 12, color: 'gray' }}>#olas365</Text>
        </TouchableOpacity>
    </View>
}

const profileContentViewAtom = atom<string>("photos");

/**
 * List of kind 1s we've already evaluated in the postFilterFn
 */
const knownKind1s = new Map<string, boolean>()

const postFilterFn = (entry: FeedEntry) => {
    if (entry.event.kind === 1) {
        let val = knownKind1s.get(entry.event.id);
        if (val !== undefined) return val;

        val = !!entry.event.content.match(imageOrVideoUrlRegexp);
        knownKind1s.set(entry.event.id, val);

        return val;
    }

    return true;
}

const currentYear = new Date().getFullYear();

function getDayOfYear(timestamp: number) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const diffTime = Math.abs(date.getTime() - startOfYear.getTime());
    const difference_In_Days = Math.ceil(diffTime / (1000 * 3600 * 24)); 

    if (year !== currentYear) return;
    
    return difference_In_Days;
}

function EmptyDay() {
    return <View style={{ backgroundColor: '#ddd', flex: 1, width: '100%', height: '100%' }} />
}

function Olas365View({ pubkey,  }: { pubkey: string }) {
    const { events } = useSubscribe([
        { kinds: [NDKKind.Image], "#t": ["olas365", "#Olas365"], authors: [pubkey] },
    ], undefined, [pubkey])

    const renderEntries = useMemo(() => {
        const dayOfTodayInTheYear = getDayOfYear(new Date().getTime() / 1000);
        const days = Array.from({ length: dayOfTodayInTheYear }, (_, index) => (
            { day: index + 1, event: null }
        ));
    
        for (const event of events) {
            const day = getDayOfYear(event.created_at);
            if (!day) continue;
            days[day-1].event = event;
        }

        return days.reverse();
    }, [events]);
    
    const renderItem = useCallback(({ item: { day, event } }: { item: { day: number, event: NDKEvent } }) => {
        return <View style={{ width: Dimensions.get('window').width / 3, height: Dimensions.get('window').width / 3 }}>
            {event ? (
                <EventMediaContainer
                    event={event}
                    width={Dimensions.get('window').width / 3}
                    height={Dimensions.get('window').width / 3}
                    contentFit="cover"
                    maxWidth={Dimensions.get('window').width}
                    maxHeight={Dimensions.get('window').width}
                />
            ) : (
                <EmptyDay />
            )}

            <Text style={{ padding: 4, fontSize: 12, color: 'gray', position: 'absolute', bottom: 0, left: 0, right: 0 }}>Day {day}</Text>
        </View>
    }, []);

    return (
        <FlashList
            data={renderEntries}
            estimatedItemSize={500}
            keyExtractor={(e) => e.day.toString()}
            scrollEventThrottle={100}
            numColumns={3}
            renderItem={renderItem}
            disableIntervalMomentum={true}
        />
    )
}

function ProfileContent({ pubkey }: { pubkey: string }) {
    const [view, setView] = useAtom(profileContentViewAtom);

    const {filters, filterKey, filterFn, numColumns} = useMemo<{filters: NDKFilter[], filterKey: string, filterFn: (entry: FeedEntry) => boolean, numColumns: number}>(() => {
        let numColumns = 3;
        let filterFn: (entry: FeedEntry) => boolean | undefined;
        const res: NDKFilter[] = [];

        if (view === "posts") {
            res.push({ kinds: [NDKKind.Text], authors: [pubkey] });
            res.push({ kinds: [NDKKind.Media], authors: [pubkey] });
            filterFn = postFilterFn;
            numColumns = 1;
        } else if (view === "reels") {
            res.push({ kinds: [NDKKind.VerticalVideo], authors: [pubkey] });
        } else if (view === "photos") {
            res.push({ kinds: [NDKKind.Image], authors: [pubkey] });
            res.push({ kinds: [NDKKind.Text], '#k': ['20'], authors: [pubkey] });
        } else if (view === "products") {
            res.push({ kinds: [30402], authors: [pubkey] });
        }
        
        return { filters: res, filterKey: pubkey+view, filterFn, numColumns };
    }, [view]);

    const { colors } = useColorScheme();
    
    return (
        <>
            <View style={profileContentStyles.container}>
                <TouchableOpacity style={[profileContentStyles.button, view === 'photos' && { borderBottomColor: colors.primary }]} onPress={() => setView('photos')}>
                    <Grid size={24} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={[profileContentStyles.button, view === 'reels' && { borderBottomColor: colors.primary }]} onPress={() => setView('reels')}>
                    <ReelIcon width={24} strokeWidth={2} stroke={colors.primary} fill={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={[profileContentStyles.button, view === 'posts' && { borderBottomColor: colors.primary }]} onPress={() => setView('posts')}>
                    <Wind size={24} color={colors.primary} />
                </TouchableOpacity>

                {SHOP_ENABLED && (  
                    <TouchableOpacity style={[profileContentStyles.button, view === 'products' && { borderBottomColor: colors.primary }]} onPress={() => setView('products')}>
                        <ShoppingCart size={24} color={colors.primary} />
                    </TouchableOpacity>
                )}
                
            </View>

            {view === 'olas365' ? (
                <Olas365View pubkey={pubkey} />
            ) : (
                <Feed
                    filters={filters}
                    filterKey={filterKey}
                    filterFn={filterFn}
                    numColumns={numColumns}
                />
            )}
        </>
    )
}

const COLUMN_COUNT = SHOP_ENABLED ? 4 : 3;
const screenWidth = Dimensions.get('window').width;

const profileContentStyles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        marginTop: 10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 5,
        borderBottomWidth: 2,
        width: screenWidth / COLUMN_COUNT,
        borderBottomColor: 'transparent',
    }
});

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
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
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
