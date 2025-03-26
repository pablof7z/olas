import React, { useCallback, useState, useEffect } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, Pressable, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEditorStore } from '@/lib/publish/store/editor';
import { Stack, router } from 'expo-router';
import { X, Sliders } from 'lucide-react-native';
import { useAtom, useAtomValue, atom } from 'jotai';
import { Preview } from '@/lib/publish/components/preview/Preview';

// Create atom for selectedMediaIndex
export const selectedMediaIndexAtom = atom(0);

// Import the new media filter components
import { FilteredImage } from '@/lib/media-filter/components/FilteredImage';
import { useMediaFilter } from '@/lib/media-filter/hooks/useMediaFilter';
import FilterBottomSheet, { filterBottomSheetRefAtom } from '@/lib/media-filter/components/FilterBottomSheet';
import AdjustmentsBottomSheet, { adjustmentsBottomSheetRefAtom } from '@/lib/media-filter/components/AdjustmentsBottomSheet';
import { Button } from '@/components/nativewindui/Button';
import { useColorScheme } from '@/lib/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

const dimensions = Dimensions.get('window');

interface PreviewContentProps {
    previewHeight: number;
}

function PreviewContent({ previewHeight }: PreviewContentProps) {
    const { media } = useEditorStore();
    const [selectedMediaIndex, setSelectedMediaIndex] = useAtom(selectedMediaIndexAtom);

    const currentMedia = media[selectedMediaIndex];

    // Use the media filter hook
    const { currentFilterId, currentFilterParams, setSource, sourceUri } = useMediaFilter();

    // Set the source URI when the selected media changes
    useEffect(() => {
        if (currentMedia) {
            setSource(currentMedia.uris[0]);
        }
    }, [currentMedia, setSource]);

    const handleScroll = useCallback(
        (event: any) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const newIndex = Math.round(offsetX / dimensions.width);
            if (newIndex !== selectedMediaIndex && newIndex >= 0 && newIndex < media.length) {
                setSelectedMediaIndex(newIndex);
            }
        },
        [dimensions.width, selectedMediaIndex, media.length, setSelectedMediaIndex]
    );

    if (currentFilterId !== 'normal' && sourceUri) {
        return (
            <View style={{ flex: 1, width: '100%', minHeight: previewHeight, position: 'relative' }}>
                <FilteredImage
                    filePath={sourceUri}
                    filterParams={currentFilterParams}
                    style={{ flex: 1, width: '100%', minHeight: previewHeight }}
                    width={dimensions.width}
                    height={previewHeight}
                    contentFit="contain"
                />
            </View>
        );
    }

    return (
        <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={{ flex: 1, width: '100%', minHeight: previewHeight }}>
            {media.map((item, index) => {
                return (
                    <View
                        key={`media-item-${item.id}-${index}`}
                        style={[styles.mediaContainer, { width: dimensions.width, height: previewHeight }]}>
                        <Preview
                            selectedMedia={{
                                type: item.mediaType,
                                uri: item.uris[0],
                            }}
                        />
                    </View>
                );
            })}
        </ScrollView>
    );
}

export default function PostEditScreen() {
    const { media, updateMedia } = useEditorStore();
    const [selectedMediaIndex] = useAtom(selectedMediaIndexAtom);
    const previewHeight = dimensions.height * 0.6;
    const headerHeight = useHeaderHeight();
    const [isSaving, setIsSaving] = useState(false);

    const filterSheetRef = useAtomValue(filterBottomSheetRefAtom);
    const adjustmentsSheetRef = useAtomValue(adjustmentsBottomSheetRefAtom);

    // Use the media filter hook
    const { currentFilterId, selectFilter, sourceUri, saveImage } = useMediaFilter();

    const currentMedia = media[selectedMediaIndex];

    const handleFilters = useCallback(() => {
        filterSheetRef?.current?.present();
    }, [filterSheetRef]);

    const handleAdjustments = useCallback(() => {
        adjustmentsSheetRef?.current?.present();
    }, [adjustmentsSheetRef]);

    const handleFilterSelect = useCallback(
        (filterId: string) => {
            selectFilter(filterId);
        },
        [selectFilter]
    );

    const handleSaveFilteredImage = async () => {
        if (!currentMedia || currentFilterId === 'normal') return;

        try {
            setIsSaving(true);

            // Save the filtered image
            const newUri = await saveImage();

            if (newUri) {
                // Update the media item with the new URI at the beginning of the uris array
                updateMedia(currentMedia.id, {
                    uris: [newUri, ...currentMedia.uris],
                });
                return newUri;
            }
        } catch (error) {
            console.error('Error saving filtered image:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetFilter = () => {
        selectFilter('normal');
    };

    const handleNext = useCallback(() => {
        router.push('/publish/post/metadata');
    }, []);

    const insets = useSafeAreaInsets();

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: 'Edit',
                    headerStyle: {
                        backgroundColor: 'black',
                    },
                    headerTitleStyle: {
                        color: 'white',
                    },
                    headerLeft: () => <HeaderLeft />,
                }}
            />
            <View style={[styles.container, { paddingTop: headerHeight }]}>
                <View style={[styles.previewContainer, { height: previewHeight }]}>
                    <PreviewContent previewHeight={previewHeight} />
                </View>

                <View style={[styles.bottomActions, { bottom: insets.bottom }]}>
                    <Pressable style={styles.actionButton} onPress={handleFilters}>
                        <Text style={styles.actionButtonText}>Filters</Text>
                    </Pressable>

                    <Pressable style={styles.actionButton} onPress={handleAdjustments}>
                        <Sliders width={16} height={16} color="#fff" style={styles.actionIcon} />
                        <Text style={styles.actionButtonText}>Adjust</Text>
                    </Pressable>

                    <Pressable style={[styles.actionButton, { backgroundColor: 'white' }]} onPress={handleNext}>
                        <Text style={[styles.actionButtonText, { color: 'black', paddingHorizontal: 8 }]}>Next</Text>
                    </Pressable>
                </View>

                {sourceUri && (
                    <>
                        <FilterBottomSheet
                            selectedFilterId={currentFilterId}
                            onSelectFilter={handleFilterSelect}
                            previewImageUri={sourceUri}
                            onResetFilter={handleResetFilter}
                            onDismiss={handleResetFilter}
                            isApplying={isSaving}
                            handleSaveFilteredImage={handleSaveFilteredImage}
                        />
                        <AdjustmentsBottomSheet />
                    </>
                )}
            </View>
        </>
    );
}

const headerStyles = StyleSheet.create({
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewContainer: {
        width: '100%',
    },
    mediaContainer: {},
    mediaPreview: {
        width: '100%',
    },
    emptyState: {
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
    },
    emptyStateText: {
        color: '#666',
        fontSize: 16,
    },
    bottomActions: {
        position: 'absolute',
        left: 0,
        right: 0,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    actionIcon: {
        marginRight: 6,
    },
});
