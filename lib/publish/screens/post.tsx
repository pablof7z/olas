import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Stack, router } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
    Dimensions,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import NoPermissionsFallback from '../components/NoPermissionsFallback';
import { useEditorStore } from '../store/editor';

import PreviewContainer from '@/lib/publish/components/preview/Container';
import { useColorScheme } from '@/lib/useColorScheme';
import { mapAssetToPostMedia } from '@/utils/media';
import { PostMedia } from '../types';

const COLUMNS = 4;

// Local media item from the device media library
interface MediaItem {
    id: string;
    type: 'image' | 'video';
    uri: string;
    thumbnailUri?: string;
}

export default function PostScreen() {
    const { colors } = useColorScheme();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [hasPermission, setHasPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { media, addMedia, setIsMultipleSelectionMode } = useEditorStore();
    const heightValue = useSharedValue(0);
    const gridSize = Dimensions.get('window').width / COLUMNS;

    const openPreview = useCallback(() => {
        heightValue.value = withSpring(0, {
            damping: 20,
            stiffness: 67,
            mass: 0.5,
        });
    }, []);

    const closePreview = useCallback(() => {
        heightValue.value = withSpring(-470, {
            damping: 20,
            stiffness: 67,
            mass: 0.5,
        });
    }, []);

    const handleScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (event.nativeEvent.contentOffset.y < 10) {
                openPreview();
            } else {
                closePreview();
            }
        },
        [openPreview, closePreview]
    );

    const loadMediaLibrary = useCallback(async () => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setHasPermission(status === 'granted');

            if (status === 'granted') {
                const options: MediaLibrary.AssetsOptions = {
                    first: 100,
                    mediaType: [MediaLibrary.MediaType.photo],
                    sortBy: [MediaLibrary.SortBy.creationTime],
                };

                const { assets } = await MediaLibrary.getAssetsAsync(options);
                const formattedMedia: MediaItem[] = await Promise.all(
                    assets.map(async (asset) => {
                        if (asset.mediaType === 'video') {
                            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
                            return {
                                id: asset.id,
                                type: 'video' as const,
                                uri: asset.uri,
                                thumbnailUri: assetInfo.localUri,
                            };
                        }
                        return {
                            id: asset.id,
                            type: 'image' as const,
                            uri: asset.uri,
                        };
                    })
                );

                setMediaItems(formattedMedia);
                if (formattedMedia.length > 0) {
                    const postMedia = await mapAssetToPostMedia(assets[0]);
                    await addMedia(postMedia.uris[0], postMedia.mediaType, postMedia.id);
                }
            }
        } catch (error) {
            console.error('Error loading media library:', error);
        }
    }, [addMedia]);

    const pickImageFromLibrary = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsEditing: false,
                quality: 1,
                allowsMultipleSelection: true,
            });

            if (!result.canceled && result.assets.length > 0) {
                if (result.assets.length > 1) {
                    setIsMultipleSelectionMode(true);
                }
                
                for (const asset of result.assets) {
                    const mediaType = asset.type === 'video' ? 'video' : 'image';
                    const id = `picker-${Date.now()}`;
                    await addMedia(asset.uri, mediaType, id);
                    console.log('Added media:', asset.uri, mediaType, id);
                }
                openPreview();
                router.push('/publish/post/edit');
            }
        } catch (error) {
            console.error('Error picking image:', error);
        } finally {
            setIsLoading(false);
        }
    }, [addMedia, openPreview]);

    useEffect(() => {
        loadMediaLibrary();
    }, [loadMediaLibrary]);

    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();

    const selectMedia = useCallback(
        async (item: MediaItem) => {
            const mediaType = item.type === 'video' ? 'video' : 'image';
            await addMedia(item.uri, mediaType, item.id);
            openPreview();
        },
        [addMedia, openPreview]
    );

    // Key that changes when media changes to force re-render
    const mediaKey = useMemo(() => media.map((m) => m.id).join(','), [media]);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: 'New Post',
                    headerStyle: {
                        backgroundColor: 'black',
                    },
                    headerTitleStyle: {
                        color: 'white',
                    },
                    headerLeft: () => <HeaderLeft />,
                    headerRight: () => <HeaderRight />,
                }}
            />
            <View style={[styles.outerContainer, { paddingTop: headerHeight }]}>
                {hasPermission ? (
                    <>
                        <PreviewView heightValue={heightValue} height={gridSize * 3} />
                        <Animated.View style={[styles.container, { paddingBottom: insets.bottom }]}>
                            <FlashList
                                data={mediaItems}
                                extraData={mediaKey}
                                renderItem={({ item }) => (
                                    <MediaGridItem
                                        item={item}
                                        gridSize={gridSize}
                                        selectMedia={selectMedia}
                                        selectedMedia={media}
                                        colors={colors}
                                    />
                                )}
                                estimatedItemSize={gridSize}
                                numColumns={COLUMNS}
                                keyExtractor={(item) => item.id}
                                testID="media-grid"
                                accessible
                                accessibilityLabel="Media selection grid"
                                onScroll={handleScroll}
                            />
                        </Animated.View>
                    </>
                ) : (
                    <NoPermissionsFallback
                        onPickImage={pickImageFromLibrary}
                        onRequestPermissions={loadMediaLibrary}
                        isLoading={isLoading}
                    />
                )}
            </View>
        </>
    );
}

const MediaGridItem = memo(
    ({
        item,
        gridSize,
        selectMedia,
        selectedMedia,
        colors,
    }: {
        item: MediaItem;
        gridSize: number;
        selectMedia: (item: MediaItem) => Promise<void>;
        selectedMedia: PostMedia[];
        colors: { primary: string };
    }) => {
        const isSelected = selectedMedia.some((media) => media.id === item.id);

        return (
            <View style={[styles.gridItem, { width: gridSize, height: gridSize }]}>
                <Pressable style={styles.mediaPressable} onPress={() => selectMedia(item)}>
                    <Image
                        source={{
                            uri: item.type === 'video' ? item.thumbnailUri || item.uri : item.uri,
                        }}
                        style={styles.mediaContent}
                        contentFit="cover"
                    />
                    {item.type === 'video' && (
                        <View style={styles.videoIndicator}>
                            <Ionicons name="play-circle" size={24} color="white" />
                        </View>
                    )}
                    {isSelected && (
                        <>
                            <View style={styles.selectedOverlay} />
                            <View style={styles.checkmarkContainer}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={24}
                                    color={colors.primary}
                                />
                            </View>
                        </>
                    )}
                </Pressable>
            </View>
        );
    }
);

function PreviewView({
    heightValue,
    height,
}: { heightValue: SharedValue<number>; height: number }) {
    const { media } = useEditorStore();

    // Transform the data to match what PreviewContainer expects
    const formattedMedia = media.map((item) => ({
        type: item.mediaType as 'image' | 'video',
        uri: item.uris[0], // Use the first URI from the array
    }));

    const animatedStyle = useAnimatedStyle(() => {
        return {
            marginTop: heightValue.value,
        };
    });

    return (
        <Animated.View style={[animatedStyle, { height: 500 }]}>
            <PreviewContainer selectedMedia={formattedMedia} height={height} />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    container: {
        flex: 1,
    },
    gridContainer: {
        flex: 1,
    },
    gridItem: {
        aspectRatio: 1,
        padding: 1,
    },
    mediaPressable: {
        flex: 1,
        backgroundColor: '#222',
    },
    mediaContent: {
        width: '100%',
        height: '100%',
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    checkmarkContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    videoIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -12 }, { translateY: -12 }],
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 4,
    },
});

function HeaderLeft() {
    const handlePress = useCallback(() => {
        router.back();
    }, []);

    return (
        <Pressable onPress={handlePress}>
            <X color="white" />
        </Pressable>
    );
}

function HeaderRight() {
    const handlePress = useCallback(() => {
        router.push('/publish/post/edit');
    }, []);

    return (
        <TouchableOpacity onPress={handlePress}>
            <Text style={headerStyles.title}>Next</Text>
        </TouchableOpacity>
    );
}

const headerStyles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 16,
        height: 50,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
});
