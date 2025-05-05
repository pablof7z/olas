import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, router } from 'expo-router';
import { atom, useAtom, useAtomValue } from 'jotai';
import { Sliders, X } from 'lucide-react-native';
import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/nativewindui/Button';
import AdjustmentsBottomSheet, {
    adjustmentsBottomSheetRefAtom,
} from '@/lib/media-filter/components/AdjustmentsBottomSheet';
import FilterBottomSheet, {
    filterBottomSheetRefAtom,
} from '@/lib/media-filter/components/FilterBottomSheet';
import { FilteredImage } from '@/lib/media-filter/components/FilteredImage';
import { useMediaFilter } from '@/lib/media-filter/hooks/useMediaFilter';
import { Preview } from '@/lib/publish/components/preview/Preview';
import { useEditorStore } from '@/lib/publish/store/editor';

// Import the new media filter components
import { useColorScheme } from '@/lib/useColorScheme';

// Create atom for selectedMediaIndex
export const selectedMediaIndexAtom = atom(0);

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
    forceShowFiltered: boolean;
}

function PreviewContent({ previewHeight, forceShowFiltered }: PreviewContentProps) {
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

    // Show filtered image if forceShowFiltered is true
    if (sourceUri && forceShowFiltered) {
        return (
            <View
                style={{ flex: 1, width: '100%', minHeight: previewHeight, position: 'relative' }}
            >
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

    // Otherwise show the scrollable view
    return (
        <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={{ flex: 1, width: '100%', minHeight: previewHeight }}
        >
            {media.map((item, index) => {
                return (
                    <View
                        key={`media-item-${item.id}-${index}`}
                        style={[
                            styles.mediaContainer,
                            { width: dimensions.width, height: previewHeight },
                        ]}
                    >
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
    const [isFilterApplied, setIsFilterApplied] = useState(false);
    const [isEditingFilter, setIsEditingFilter] = useState(false);

    const filterSheetRef = useAtomValue(filterBottomSheetRefAtom);
    const adjustmentsSheetRef = useAtomValue(adjustmentsBottomSheetRefAtom);

    const currentMedia = media[selectedMediaIndex];
    const hasMultipleImages = media.length > 1;

    // Use the media filter hook
    const {
        currentFilterId,
        selectFilter,
        sourceUri,
        saveImage,
        currentFilterParams,
        updateFilterParams,
        resetFilter,
    } = useMediaFilter();

    // Determine if there's a filter to apply - filter is not 'normal' and we're actively editing
    const hasFilterToApply = currentFilterId !== 'normal' && isEditingFilter;

    // Reset filter editing state when changing images
    useEffect(() => {
        setIsEditingFilter(false);
        setIsFilterApplied(false);
    }, [selectedMediaIndex]);

    const handleFilters = useCallback(() => {
        setIsEditingFilter(true);
        filterSheetRef?.current?.present();
    }, [filterSheetRef]);

    const handleAdjustments = useCallback(() => {
        setIsEditingFilter(true);
        adjustmentsSheetRef?.current?.present();
    }, [adjustmentsSheetRef]);

    const handleFilterSelect = useCallback(
        (filterId: string) => {
            selectFilter(filterId);
            setIsEditingFilter(true);
            setIsFilterApplied(false);
        },
        [selectFilter]
    );

    const handleResetFilter = () => {
        resetFilter();
        setIsEditingFilter(false);
        setIsFilterApplied(false);
    };

    const handleFilterSheetDismiss = useCallback(() => {
        // Only keep editing if a non-normal filter is selected
        if (currentFilterId === 'normal') {
            setIsEditingFilter(false);
        }
    }, [currentFilterId]);

    const handleAdjustmentSheetDismiss = useCallback(() => {
        // Only keep editing if a non-normal filter is selected
        if (currentFilterId === 'normal') {
            setIsEditingFilter(false);
        }
    }, [currentFilterId]);

    // Apply the filter to the current image
    const applyFilter = useCallback(async () => {
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

                // Mark this filter as applied and no longer editing
                setIsFilterApplied(true);
                setIsEditingFilter(false);
            }
        } catch (error) {
            console.error('Error saving filtered image:', error);
        } finally {
            setIsSaving(false);
        }
    }, [currentFilterId, sourceUri, currentMedia, saveImage, updateMedia]);

    // Navigate to next screen
    const handleNext = useCallback(() => {
        // If there's a filter to apply for a single image, apply it and navigate
        if (hasFilterToApply && !hasMultipleImages) {
            // Apply the filter and then navigate
            const applyFilterAndNavigate = async () => {
                await applyFilter();
                router.push('/publish/post/metadata');
            };
            applyFilterAndNavigate();
        } else {
            // Just navigate without applying
            router.push('/publish/post/metadata');
        }
    }, [hasFilterToApply, hasMultipleImages, applyFilter]);

    // Determine what to display for the button
    const buttonText = useMemo(() => {
        if (isSaving) return 'Applying...';
        if (hasMultipleImages && hasFilterToApply) return 'Apply';
        return 'Next';
    }, [hasMultipleImages, hasFilterToApply, isSaving]);

    // Debug logs for tracking state
    useEffect(() => {}, [
        hasMultipleImages,
        isFilterApplied,
        isEditingFilter,
        currentFilterId,
        hasFilterToApply,
        buttonText,
        media.length,
    ]);

    // Determine what action to take when the button is pressed
    const handleButtonPress = useCallback(() => {
        if (hasMultipleImages && hasFilterToApply) {
            applyFilter();
        } else {
            handleNext();
        }
    }, [hasMultipleImages, hasFilterToApply, applyFilter, handleNext]);

    // For multiple images, we only force show the filtered view when actively editing
    // For single image, we always show the filtered view
    const shouldForceShowFiltered = !hasMultipleImages || isEditingFilter;

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
                    <PreviewContent
                        previewHeight={previewHeight}
                        forceShowFiltered={shouldForceShowFiltered}
                    />
                </View>

                <View style={[styles.bottomActions, { bottom: insets.bottom }]}>
                    <Pressable style={styles.actionButton} onPress={handleFilters}>
                        <Text style={styles.actionButtonText}>Filters</Text>
                    </Pressable>

                    <Pressable style={styles.actionButton} onPress={handleAdjustments}>
                        <Sliders width={16} height={16} color="#fff" style={styles.actionIcon} />
                        <Text style={styles.actionButtonText}>Adjust</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.actionButton, { backgroundColor: 'white' }]}
                        onPress={handleButtonPress}
                        disabled={isSaving}
                    >
                        <Text
                            style={[
                                styles.actionButtonText,
                                { color: 'black', paddingHorizontal: 8 },
                            ]}
                        >
                            {buttonText}
                        </Text>
                    </Pressable>
                </View>

                {sourceUri && (
                    <>
                        <FilterBottomSheet
                            selectedFilterId={currentFilterId}
                            onSelectFilter={handleFilterSelect}
                            previewImageUri={sourceUri}
                            onResetFilter={handleResetFilter}
                            onDismiss={handleFilterSheetDismiss}
                        />
                        <AdjustmentsBottomSheet onDismiss={handleAdjustmentSheetDismiss} />
                    </>
                )}
            </View>
        </>
    );
}

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
