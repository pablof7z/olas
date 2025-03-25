import PreviewContainer from "@/lib/publish/components/preview/Container";
import { mapAssetToPostMedia } from "@/utils/media";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useHeaderHeight } from "@react-navigation/elements";
import { Stack, router } from "expo-router";
import { X } from "lucide-react-native";
import React, { useState, useEffect, useCallback } from "react";
import { Dimensions, View, Pressable, TouchableOpacity, Text, NativeScrollEvent, NativeSyntheticEvent, StyleSheet } from "react-native";
import { useColorScheme } from '@/lib/useColorScheme';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEditorStore, MediaItem as EditorMediaItem } from "../store/editor";
import { Image } from "expo-image";
import * as MediaLibrary from 'expo-media-library';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

const COLUMNS = 4;

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
    const { selectedMedia, addMedia, isMultipleSelectionMode } = useEditorStore();
    const heightValue = useSharedValue(0);

    const openPreview = useCallback(() => {
        heightValue.value = withSpring(0, {
            damping: 20,
            stiffness: 67,
            mass: 0.5
        });
    }, []);

    const closePreview = useCallback(() => {
        heightValue.value = withSpring(-470, {
            damping: 20,
            stiffness: 67,
            mass: 0.5
        });
    }, []);
    
    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (event.nativeEvent.contentOffset.y < 10) {
            openPreview();
        } else {
            closePreview();
        }
    }, [openPreview, closePreview]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            marginTop: heightValue.value,
        };
    });

    useEffect(() => {
        (async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setHasPermission(status === 'granted');
            
            if (status === 'granted') {
                const options: MediaLibrary.AssetsOptions = {
                    first: 100,
                    mediaType: [MediaLibrary.MediaType.photo],
                    sortBy: [MediaLibrary.SortBy.creationTime]
                };
                
                const { assets } = await MediaLibrary.getAssetsAsync(options);
                const formattedMedia: MediaItem[] = await Promise.all(assets.map(async (asset) => {
                    if (asset.mediaType === 'video') {
                        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
                        return {
                            id: asset.id,
                            type: 'video' as const,
                            uri: asset.uri,
                            thumbnailUri: assetInfo.localUri
                        };
                    }
                    return {
                        id: asset.id,
                        type: 'image' as const,
                        uri: asset.uri
                    };
                }));
                
                setMediaItems(formattedMedia);
                if (formattedMedia.length > 0) {
                    const postMedia = await mapAssetToPostMedia(assets[0]);
                    // Convert postMedia to EditorMediaItem format
                    const mediaItem: EditorMediaItem = {
                        id: postMedia.id,
                        type: 'image',
                        uris: postMedia.uris
                    };
                    await addMedia(mediaItem);
                }
            }
        })();
    }, []);

    const gridSize = Dimensions.get('window').width / COLUMNS;
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();

    const selectMedia = useCallback(async (asset: MediaLibrary.Asset) => {
        const postMedia = await mapAssetToPostMedia(asset);
        
        // Convert postMedia to EditorMediaItem format
        const mediaItem: EditorMediaItem = {
            id: postMedia.id,
            type: postMedia.mediaType === 'video' ? 'video' : 'image',
            uris: postMedia.uris
        };
        
        await addMedia(mediaItem);
        openPreview();
    }, [addMedia, openPreview]);
    
    const renderMediaItem = ({ item }: { item: MediaItem }) => {
        const isSelected = selectedMedia.some(media => media.id === item.id);
        
        return (
            <View style={[styles.gridItem, { width: gridSize, height: gridSize }]}>
                <Pressable 
                    style={styles.mediaPressable}
                    onPress={async () => {
                        const asset = await MediaLibrary.getAssetInfoAsync(item.id);
                        await selectMedia(asset);
                    }}
                >
                    <Image
                        source={{ uri: item.type === 'video' ? item.thumbnailUri || item.uri : item.uri }}
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
                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            </View>
                        </>
                    )}
                </Pressable>
            </View>
        );
    };

    return (
        <>
            <Stack.Screen options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: 'New Post',
                headerStyle: {
                    backgroundColor: 'black',
                },
                headerTitleStyle: {
                    color: 'white'
                },
                headerLeft: () => <HeaderLeft />,
                headerRight: () => <HeaderRight />
            }} />
            <View style={[ styles.outerContainer, { paddingTop: headerHeight }]}>
                <Animated.View style={[animatedStyle, { height: 500 }]}>
                    <PreviewContainer
                        selectedMedia={selectedMedia?.length > 0 ? {
                            type: selectedMedia[selectedMedia.length - 1].type,
                            uri: selectedMedia[selectedMedia.length - 1].uris[0]
                        } : null} 
                        height={gridSize * 3}
                    />
                </Animated.View>
                <Animated.View 
                    style={[styles.container, { paddingBottom: insets.bottom }]}
                >
                    <FlashList
                        data={mediaItems}
                        renderItem={renderMediaItem}
                        estimatedItemSize={gridSize}
                        numColumns={COLUMNS}
                        keyExtractor={(item) => item.id}
                        testID="media-grid"
                        accessible={true}
                        accessibilityLabel="Media selection grid"
                        onScroll={handleScroll}
                    />
                    
                    {!hasPermission && (
                        <View style={styles.permissionOverlay}>
                            <Text style={styles.permissionText}>
                                Please grant media library access to select photos and videos
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: 'black'
    },
    container: {
        flex: 1,
    },
    gridContainer: {
        flex: 1,
    },
    gridItem: {
        aspectRatio: 1,
        padding: 1
    },
    mediaPressable: {
        flex: 1,
        backgroundColor: '#222'
    },
    mediaContent: {
        width: '100%',
        height: '100%'
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.3)'
    },
    checkmarkContainer: {
        position: 'absolute',
        top: 8,
        right: 8
    },
    permissionOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    permissionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 16
    },
    videoIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -12 }, { translateY: -12 }],
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 4
    }
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
        alignItems: 'center'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white'
    }
});
