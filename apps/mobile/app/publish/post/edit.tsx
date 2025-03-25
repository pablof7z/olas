import React, { useCallback } from "react";
import { View, ScrollView, Dimensions, StyleSheet, Pressable, TouchableOpacity, Text } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useEditorStore } from "@/lib/publish/store/editor";
import { Image } from "expo-image";
import { Stack, router } from "expo-router";
import { X, Sliders } from "lucide-react-native";
import FilterBottomSheet, { filterBottomSheetRefAtom } from "@/lib/publish/filters/bottom-sheet";
import AdjustmentsBottomSheet, { adjustmentsBottomSheetRefAtom } from "@/lib/publish/filters/adjustments-bottom-sheet";
import { FilteredImage } from "@/lib/publish/filters/components/FilteredImage";
import { useFilter } from "@/lib/publish/filters/hooks/useFilter";
import { useImage } from "@shopify/react-native-skia";
import { useAtomValue, useSetAtom } from "jotai";
import { Preview } from "@/lib/publish/components/preview/Preview";

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
        router.push('/publish/post/metadata');
    }, []);
    
    return (
        <TouchableOpacity onPress={handlePress}>
            <Text style={headerStyles.title}>Next</Text>
        </TouchableOpacity>
    );
}

const dimensions = Dimensions.get('window');

interface PreviewContentProps {
    previewHeight: number;
}

function PreviewContent({ previewHeight }: PreviewContentProps) {
    const { selectedMedia, selectedMediaIndex, setSelectedMediaIndex } = useEditorStore();
    const { currentMedia } = useFilter();

    const handleScroll = useCallback((event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / dimensions.width);
        if (newIndex !== selectedMediaIndex && newIndex >= 0 && newIndex < selectedMedia.length) {
            setSelectedMediaIndex(newIndex);
        }
    }, [dimensions.width, selectedMediaIndex, selectedMedia.length, setSelectedMediaIndex]);

    if (currentMedia?.filter) {
        return <FilteredImage
            filePath={currentMedia.uris[0]}
            filterParams={currentMedia.filter?.parameters || {}}
            style={{ flex: 1, width: '100%', minHeight: previewHeight }}
            width={dimensions.width}
            height={previewHeight}
            contentFit="contain"
        />
    }


    return (
        <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={{ flex: 1, width: '100%', minHeight: previewHeight }}
        >
            {selectedMedia.map((item, index) => {
                return (
                    <View 
                        key={`media-item-${item.id}-${index}`} 
                        style={[styles.mediaContainer, { width: dimensions.width, height: previewHeight }]}
                    >
                        <Preview
                            selectedMedia={{
                                type: item.type,
                                uri: item.uris[0]
                            }}
                            style={{ width: '100%', minHeight: previewHeight }}
                            contentFit="contain"
                        />
                    </View>
                );
            })}
        </ScrollView>
    );
}

export default function PostEditScreen() {
    const { currentMedia, currentFilterId, selectFilter } = useFilter();
    const previewHeight = dimensions.height * 0.6;
    const headerHeight = useHeaderHeight();
    
    const filterSheetRef = useAtomValue(filterBottomSheetRefAtom);
    const adjustmentsSheetRef = useAtomValue(adjustmentsBottomSheetRefAtom);
    
    const handleFilters = useCallback(() => {
        filterSheetRef?.current?.present();
    }, [filterSheetRef]);
    
    const handleAdjustments = useCallback(() => {
        adjustmentsSheetRef?.current?.present();
    }, [adjustmentsSheetRef]);

    const handleFilterSelect = useCallback((filterId: string) => {
        selectFilter(filterId);
    }, [selectFilter]);

    return (
        <>
            <Stack.Screen options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: 'Edit',
                headerStyle: {
                    backgroundColor: 'black',
                },
                headerTitleStyle: {
                    color: 'white'
                },
                headerLeft: () => <HeaderLeft />,
                headerRight: () => <HeaderRight />
            }} />
            <View style={[styles.container, { paddingTop: headerHeight }]}>
                <View style={[styles.previewContainer, { height: previewHeight }]}>
                    <PreviewContent previewHeight={previewHeight} />
                </View>

                <View style={styles.bottomActions}>
                    <Pressable 
                        style={styles.actionButton}
                        onPress={handleFilters}
                    >
                        <Text style={styles.actionButtonText}>Filters</Text>
                    </Pressable>
                    
                    <Pressable
                        style={styles.actionButton}
                        onPress={handleAdjustments}
                    >
                        <Sliders width={16} height={16} color="#fff" style={styles.actionIcon} />
                        <Text style={styles.actionButtonText}>Adjust</Text>
                    </Pressable>
                </View>

                {currentMedia && (
                    <>
                        <FilterBottomSheet
                            selectedFilterId={currentFilterId}
                            onSelectFilter={handleFilterSelect}
                            previewImageUri={currentMedia.uris[0]}
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
        color: 'white'
    }
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewContainer: {
        width: '100%',
    },
    mediaContainer: {
        aspectRatio: 1,
    },
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
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
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
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    actionIcon: {
        marginRight: 6,
    },
});