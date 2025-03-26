import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    Pressable,
    StyleProp,
    ViewStyle,
    TextInput,
    Touchable,
} from 'react-native';
import * as User from '@/components/ui/user';
import {
    NDKEvent,
    NDKImage,
    NDKSubscriptionCacheUsage,
    NDKUser,
    NDKUserProfile,
    NostrEvent,
    useNDKCurrentUser,
    useUserProfile,
    useUsersStore,
} from '@nostr-dev-kit/ndk-mobile';
import ReelIcon from '@/components/icons/reel';
import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { NDKFilter } from '@nostr-dev-kit/ndk-mobile';
import { NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { useSubscribe, useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FollowButton from '@/components/buttons/follow';
import { Image } from 'expo-image';
import EventContent from '@/components/ui/event/content';
import { ArrowLeft, Check, Copy, Grid, ImageIcon, ShoppingCart, Wind, X } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import Feed from '@/components/Feed';
import { useUserFlare } from '@/hooks/user-flare';
import { BlurView } from 'expo-blur';
import { useObserver } from '@/hooks/observer';
import EventMediaContainer from '@/components/media/event';
import { prettifyNip05 } from '@/utils/user';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { imageOrVideoUrlRegexp } from '@/utils/media';
import { FeedEntry } from '@/components/Feed/hook';
import { SHOP_ENABLED } from '@/utils/const';
import ImageCropPicker from 'react-native-image-crop-picker';
import { prepareMedia } from '@/utils/media/prepare';
import { uploadMedia } from '@/lib/publish/actions/upload';
import BackButton from '@/components/buttons/back-button';
import { toast } from '@backpackapp-io/react-native-toast';

export const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const editStateAtom = atom<string | null>(null);
const editProfileAtom = atom<NDKUserProfile | null>(null);

function CopyToClipboard({ text, size = 16 }: { text: string; size?: number }) {
    const { colors } = useColorScheme();
    const [copied, setCopied] = useState(false);
    const copy = useCallback(() => {
        Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }, [text]);

    return (
        <Pressable onPress={copy} style={{ marginLeft: 4 }}>
            {copied ? <Check size={size} color={colors.muted} /> : <Copy size={size} color={colors.muted} />}
        </Pressable>
    );
}

function Header({
    user,
    pubkey,
    userProfile,
    scrollY,
}: {
    user: NDKUser;
    pubkey: string;
    userProfile?: NDKUserProfile;
    scrollY: Animated.Value;
}) {
    const { colors } = useColorScheme();
    const insets = useSafeAreaInsets();
    const bannerHeight = insets.top + headerStyles.leftContainer.height + 50;
    const currentUser = useNDKCurrentUser();

    // Create a new Animated.Value for blur intensity
    const defaultBlurValue = new Animated.Value(0);
    const [editState, setEditState] = useAtom(editStateAtom);
    const [editProfile, setEditProfile] = useAtom(editProfileAtom);

    // Use the scrollY value if available, otherwise use the default
    const blurIntensity = scrollY
        ? scrollY.interpolate({
              inputRange: [0, bannerHeight / 2, bannerHeight],
              outputRange: [0, 0, 100],
              extrapolate: 'clamp',
          })
        : defaultBlurValue;

    // Create opacity animation for the username
    const usernameOpacity = scrollY
        ? scrollY.interpolate({
              inputRange: [0, bannerHeight / 2, bannerHeight],
              outputRange: [0, 0.5, 1],
              extrapolate: 'clamp',
          })
        : defaultBlurValue;

    const cancelProfileEdit = useCallback(() => {
        setEditState(null);
        setEditProfile(null);
    }, [setEditState, setEditProfile]);

    const startProfileEdit = useCallback(() => {
        setEditState('edit');
        setEditProfile(userProfile);
    }, [setEditState, setEditProfile, userProfile]);

    const { ndk } = useNDK();
    const updateUserProfile = useUsersStore((s) => s.update);

    const saveProfileEdit = useCallback(async () => {
        setEditState('saving');
        const e = new NDKEvent(ndk, { kind: 0 } as NostrEvent);
        const profileWithoutEmptyValues = Object.fromEntries(Object.entries(editProfile || {}).filter(([_, value]) => value !== null));
        delete profileWithoutEmptyValues.created_at;

        e.content = JSON.stringify(profileWithoutEmptyValues);
        await e.publishReplaceable();
        console.log('publishing profile', JSON.stringify(e.rawEvent(), null, 4));
        if (editProfile) updateUserProfile(pubkey, editProfile);
        setEditState(null);
    }, [editProfile, setEditState, pubkey, ndk, updateUserProfile]);

    return (
        <AnimatedBlurView intensity={blurIntensity} style={[headerStyles.container, { paddingTop: insets.top }]}>
            <View style={headerStyles.leftContainer}>
                {editState === 'edit' ? (
                    <TouchableOpacity
                        onPress={cancelProfileEdit}
                        style={{
                            paddingHorizontal: 10,
                            backgroundColor: '#00000055',
                            borderRadius: 100,
                            width: 40,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginHorizontal: 10,
                        }}>
                        <X size={24} color={'white'} />
                    </TouchableOpacity>
                ) : (
                    <BackButton />
                )}

                <Animated.View style={{ flexDirection: 'row', alignItems: 'center', opacity: usernameOpacity }}>
                    <Pressable onPress={() => router.back()} style={{ flexDirection: 'column' }}>
                        <User.Name
                            userProfile={editProfile || userProfile}
                            pubkey={pubkey}
                            style={{ color: colors.foreground, fontSize: 20, fontWeight: 'bold' }}
                        />
                        {userProfile?.nip05 && (
                            <Text style={{ color: colors.muted, fontSize: 12 }}>{prettifyNip05(userProfile?.nip05)}</Text>
                        )}
                    </Pressable>
                    <CopyToClipboard text={userProfile?.nip05 || user.npub} size={16} />
                </Animated.View>
            </View>

            <Animated.View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {currentUser?.pubkey === pubkey && editState && (
                    <TouchableOpacity
                        onPress={saveProfileEdit}
                        style={{
                            paddingHorizontal: 20,
                            backgroundColor: '#00000055',
                            borderRadius: 100,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginHorizontal: 10,
                        }}>
                        <Text style={{ color: 'white', fontSize: 14 }}>Save</Text>
                    </TouchableOpacity>
                )}
                {currentUser?.pubkey === pubkey && !editState && (
                    <TouchableOpacity
                        onPress={startProfileEdit}
                        style={{
                            paddingHorizontal: 20,
                            backgroundColor: '#00000055',
                            borderRadius: 100,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginHorizontal: 10,
                        }}>
                        <Text style={{ color: 'white', fontSize: 14 }}>Edit</Text>
                    </TouchableOpacity>
                )}
                {currentUser?.pubkey !== pubkey && <FollowButton variant="secondary" pubkey={pubkey} size="sm" className="mx-4" />}
            </Animated.View>
        </AnimatedBlurView>
    );
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
    const { pubkey, view } = useLocalSearchParams() as { pubkey: string; view?: string };
    const { ndk } = useNDK();
    const user = ndk.getUser({ pubkey });
    const currentUser = useNDKCurrentUser();
    const { userProfile } = useUserProfile(pubkey);
    const flare = useUserFlare(pubkey);
    const scrollY = useRef(new Animated.Value(0)).current;
    const { events: content } = useSubscribe(
        [
            { kinds: [NDKKind.Image, NDKKind.VerticalVideo, 21], authors: [pubkey] },
            { kinds: [NDKKind.Text], '#k': ['20'], authors: [pubkey] },
            { kinds: [NDKKind.Text], authors: [pubkey] },
            { kinds: [30402], authors: [pubkey] },
            { kinds: [NDKKind.Metadata, NDKKind.Contacts], authors: [pubkey] },
        ],
        { wrap: true, skipVerification: true },
        [pubkey]
    );
    const [editState, setEditState] = useAtom(editStateAtom);
    const setEditProfile = useSetAtom(editProfileAtom);

    useEffect(() => {
        if (currentUser?.pubkey !== pubkey && editState === 'edit') {
            setEditState(null);
            setEditProfile(null);
        }
    }, [currentUser?.pubkey, editState, pubkey]);

    const olasContent = useMemo(() => {
        return content.filter((e) => e.kind === NDKKind.Image || e.kind === NDKKind.VerticalVideo);
    }, [content.length]);

    const followCount = useMemo(() => {
        const contacts = content.find((e) => e.kind === NDKKind.Contacts);
        if (!contacts) return 0;
        const followTags = contacts.tags.filter((t) => t[0] === 'p');
        if (!followTags) return 0;
        return new Set(followTags.map((t) => t[1])).size;
    }, [content]);

    const insets = useSafeAreaInsets();
    const { colors } = useColorScheme();
    const setView = useSetAtom(profileContentViewAtom);

    useEffect(() => {
        if (view) {
            setView(view);
        }
    }, [view]);

    const containerStyle = useMemo<StyleProp<ViewStyle>>(() => ({ flex: 1, backgroundColor: colors.card }), [colors.card]);

    const hasProducts = useMemo(() => {
        return content.some((e) => e.kind === 30402);
    }, [content]);

    if (!pubkey) return null;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    header: () => <Header user={user} pubkey={pubkey} userProfile={userProfile} scrollY={scrollY} />,
                }}
            />
            <View style={containerStyle}>
                <Animated.ScrollView
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={16}>
                    <View
                        style={{
                            width: '100%',
                            height: insets.top + headerStyles.leftContainer.height + 100,
                            backgroundColor: `#${user.pubkey.slice(0, 6)}`,
                        }}>
                        <Banner pubkey={pubkey} />
                    </View>
                    <View style={[styles.header, { marginTop: -48, marginBottom: 10 }]}>
                        <Avatar pubkey={pubkey} userProfile={userProfile} flare={flare} colors={colors} />
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber} className="text-foreground">
                                    {olasContent.length}
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
                            <Name userProfile={userProfile} pubkey={pubkey} colors={colors} />
                            <CopyToClipboard text={userProfile?.nip05 || user.npub} size={16} />
                        </View>
                        {userProfile?.nip05 && (
                            <Text style={{ color: colors.muted, fontSize: 12 }}>{prettifyNip05(userProfile?.nip05)}</Text>
                        )}
                        <About userProfile={userProfile} colors={colors} />
                    </View>

                    <StoriesContainer pubkey={pubkey} />

                    <ProfileContent pubkey={pubkey} hasProducts={hasProducts} />
                </Animated.ScrollView>
            </View>
        </>
    );
}

function Banner({ pubkey }: { pubkey: string }) {
    const { userProfile } = useUserProfile(pubkey);
    const insets = useSafeAreaInsets();
    const [editProfile, setEditProfile] = useAtom(editProfileAtom);
    const editState = useAtomValue(editStateAtom);

    const width = Dimensions.get('window').width;
    const height = insets.top + headerStyles.leftContainer.height + 100;
    const { ndk } = useNDK();

    const handleChooseImage = useCallback(() => {
        ImageCropPicker.openPicker({
            width: width,
            height: height,
            cropping: true,
        }).then(async (image) => {
            setEditProfile({ ...editProfile, banner: image.path });

            // upload the image
            const media = await prepareMedia([{ uris: [image.path], id: 'banner', mediaType: 'image', contentMode: 'landscape' }]);
            const uploaded = await uploadMedia(media, ndk);
            if (!uploaded[0].uploadedUri) {
                toast.error('Failed to upload profile banner');
                return;
            }
            setEditProfile({ ...editProfile, banner: uploaded[0].uploadedUri });
        });
    }, [editProfile, setEditProfile]);

    if (editState === 'edit') {
        return (
            <TouchableOpacity
                onPress={handleChooseImage}
                style={{
                    width: '100%',
                    height,
                    backgroundColor: `#${pubkey.slice(0, 6)}`,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                <Image
                    source={{ uri: editProfile?.banner }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: insets.top + headerStyles.leftContainer.height + 100,
                        flex: 1,
                    }}
                    contentFit="cover"
                />
                <View
                    style={{
                        position: 'absolute',
                        top: '50%',
                        marginTop: 20,
                        right: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000000bb',
                        borderRadius: 100,
                        width: 40,
                        height: 40,
                    }}
                    onPress={handleChooseImage}>
                    <ImageIcon size={18} color="white" />
                </View>
            </TouchableOpacity>
        );
    }

    if (!userProfile?.banner) return null;

    return (
        <Image
            source={{ uri: userProfile?.banner }}
            style={{ width: '100%', height: insets.top + headerStyles.leftContainer.height + 100 }}
            contentFit="cover"
        />
    );
}

function Avatar({
    pubkey,
    userProfile,
    flare,
    colors,
}: {
    pubkey: string;
    userProfile?: NDKUserProfile;
    flare?: NDKUserFlare;
    colors: Record<string, string>;
}) {
    const [editProfile, setEditProfile] = useAtom(editProfileAtom);
    const editState = useAtomValue(editStateAtom);
    const { ndk } = useNDK();

    const handleChooseImage = useCallback(() => {
        ImageCropPicker.openPicker({
            width: 400,
            height: 400,
            cropping: true,
            multiple: false,
            mediaType: 'photo',
            includeExif: false,
        }).then(async (image) => {
            setEditProfile({ ...editProfile, picture: image.path });

            // upload the image
            const media = await prepareMedia([{ uris: [image.path], id: 'avatar', mediaType: 'image', contentMode: 'square' }]);
            const uploaded = await uploadMedia(media, ndk);
            if (!uploaded[0].uploadedUri) {
                toast.error('Failed to upload profile picture');
                return;
            }

            setEditProfile({ ...editProfile, picture: uploaded[0].uploadedUri });
        });
    }, []);

    if (editState === 'edit') {
        return (
            <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                <User.Avatar
                    pubkey={pubkey}
                    userProfile={editProfile}
                    imageSize={90}
                    flare={flare}
                    canSkipBorder={true}
                    borderWidth={3}
                    skipProxy={true}
                />
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000000bb',
                        borderRadius: 100,
                        width: 40,
                        height: 40,
                        transform: [{ translateX: 5 }, { translateY: 5 }],
                    }}
                    onPress={handleChooseImage}>
                    <ImageIcon size={18} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    return <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={90} flare={flare} canSkipBorder={true} borderWidth={3} />;
}

function About({ userProfile, colors }: { userProfile?: NDKUserProfile; colors: Record<string, string> }) {
    const [editProfile, setEditProfile] = useAtom(editProfileAtom);
    const editState = useAtomValue(editStateAtom);

    const setAbout = useCallback(
        (text: string) => {
            setEditProfile({ ...editProfile, about: text });
        },
        [editProfile, setEditProfile]
    );

    if (editState === 'edit') {
        return (
            <TextInput
                value={editProfile?.about || ''}
                multiline
                onChangeText={setAbout}
                style={{
                    color: colors.foreground,
                    fontSize: 13,
                    borderWidth: 1,
                    minHeight: 100,
                    borderColor: colors.grey3,
                    padding: 10,
                    marginVertical: 10,
                    marginHorizontal: -6,
                    borderRadius: 5,
                    flex: 1,
                    width: '100%',
                }}
            />
        );
    }

    const about = editProfile?.about || userProfile?.about;

    if (!about) return null;

    return (
        <Text style={styles.bio} className="text-muted-foreground">
            <EventContent content={about} />
        </Text>
    );
}

function Name({ userProfile, pubkey, colors }: { userProfile?: NDKUserProfile; pubkey: string; colors: Record<string, string> }) {
    const [editProfile, setEditProfile] = useAtom(editProfileAtom);
    const editState = useAtomValue(editStateAtom);

    const setName = useCallback(
        (text: string) => {
            setEditProfile({ ...editProfile, name: text });
        },
        [editProfile, setEditProfile]
    );

    if (editState === 'edit') {
        return (
            <TextInput
                value={editProfile?.name || ''}
                onChangeText={setName}
                style={{
                    color: colors.foreground,
                    fontSize: 16,
                    fontWeight: 'bold',
                    borderWidth: 1,
                    borderColor: colors.grey3,
                    padding: 5,
                    margin: -6,
                    borderRadius: 5,
                    flex: 1,
                }}
            />
        );
    }

    return <User.Name userProfile={userProfile} pubkey={pubkey} style={{ color: colors.foreground, fontSize: 16, fontWeight: 'bold' }} />;
}

function StoriesContainer({ pubkey }: { pubkey: string }) {
    const latestOlas365 = useObserver([{ '#t': ['olas365'], authors: [pubkey], limit: 1 }], { wrap: true, cacheUnconstrainFilter: [] }, [
        pubkey,
    ]);

    const handleOpenStories = useCallback(() => {
        router.push(`/365?pubkey=${pubkey}`);
    }, [latestOlas365.length]);

    if (!latestOlas365.length) return null;

    return (
        <View style={{ flex: 1, marginHorizontal: 20, marginTop: 20, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
                style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                onPress={handleOpenStories}>
                <View style={{ flexDirection: 'row', gap: 10, width: 40, height: 40, borderRadius: 40, overflow: 'hidden' }}>
                    <EventMediaContainer
                        event={latestOlas365[0]}
                        width={40}
                        className="rounded-lg"
                        singleMode
                        onPress={handleOpenStories}
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
    );
}

const profileContentViewAtom = atom<string>('photos');

/**
 * List of kind 1s we've already evaluated in the postFilterFn
 */
const knownKind1s = new Map<string, boolean>();

const postFilterFn = (entry: FeedEntry) => {
    if (entry?.event?.kind === 1) {
        let val = knownKind1s.get(entry.event.id);
        if (val !== undefined) return val;

        if (entry.event.hasTag('e')) val = false;
        else val = !!entry.event.content.match(imageOrVideoUrlRegexp);
        knownKind1s.set(entry.event.id, val);

        return val;
    }

    return true;
};

function ProfileContent({ pubkey, hasProducts }: { pubkey: string; hasProducts: boolean }) {
    const [view, setView] = useAtom(profileContentViewAtom);

    const { filters, filterKey, filterFn, numColumns } = useMemo<{
        filters: NDKFilter[];
        filterKey: string;
        filterFn: (entry: FeedEntry) => boolean;
        numColumns: number;
    }>(() => {
        let numColumns = 3;
        let filterFn: (entry: FeedEntry) => boolean | undefined;
        const res: NDKFilter[] = [];

        if (view === 'posts') {
            res.push({ kinds: [NDKKind.Text], authors: [pubkey] });
            filterFn = postFilterFn;
            numColumns = 3;
        } else if (view === 'reels') {
            res.push({ kinds: [NDKKind.VerticalVideo, 21], authors: [pubkey] });
        } else if (view === 'photos') {
            res.push({ kinds: [NDKKind.Image], authors: [pubkey] });
            res.push({ kinds: [NDKKind.Text], '#k': ['20'], authors: [pubkey] });
        } else if (view === 'products') {
            res.push({ kinds: [30402], authors: [pubkey] });
        }

        return { filters: res, filterKey: pubkey + view, filterFn, numColumns };
    }, [view]);

    const { colors } = useColorScheme();

    const activeButtonStyle = useMemo<StyleProp<ViewStyle>>(
        () => ({ borderBottomWidth: 2, borderBottomColor: colors.primary }),
        [colors.primary]
    );
    const inactiveButtonStyle = useMemo<StyleProp<ViewStyle>>(() => ({ borderBottomWidth: 2, borderBottomColor: 'transparent' }), []);

    const COLUMN_COUNT = hasProducts ? 4 : 3;
    const screenWidth = Dimensions.get('window').width;

    const buttonStyle = useMemo<StyleProp<ViewStyle>>(
        () => ({
            ...profileContentStyles.button,
            width: screenWidth / COLUMN_COUNT,
        }),
        [screenWidth, COLUMN_COUNT]
    );

    return (
        <>
            <View style={profileContentStyles.container}>
                <TouchableOpacity
                    style={[buttonStyle, view === 'photos' ? activeButtonStyle : inactiveButtonStyle]}
                    onPress={() => setView('photos')}>
                    <Grid size={24} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[buttonStyle, view === 'reels' ? activeButtonStyle : inactiveButtonStyle]}
                    onPress={() => setView('reels')}>
                    <ReelIcon width={24} strokeWidth={2} stroke={colors.primary} fill={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[buttonStyle, view === 'posts' ? activeButtonStyle : inactiveButtonStyle]}
                    onPress={() => setView('posts')}>
                    <Wind size={24} color={colors.primary} />
                </TouchableOpacity>

                {hasProducts && (
                    <TouchableOpacity
                        style={[buttonStyle, view === 'products' ? activeButtonStyle : inactiveButtonStyle]}
                        onPress={() => setView('products')}>
                        <ShoppingCart size={24} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            <Feed
                filters={filters}
                filterKey={filterKey}
                filterFn={filterFn}
                numColumns={numColumns}
                filterOpts={{ cacheUsage: NDKSubscriptionCacheUsage.ONLY_CACHE }}
            />
        </>
    );
}

const profileContentStyles = StyleSheet.create({
    container: {
        marginTop: 20,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 5,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
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
    header: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        alignItems: 'flex-end',
        marginBottom: 5,
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
