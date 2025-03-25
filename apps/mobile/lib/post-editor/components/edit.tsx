import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { create } from 'zustand';
import { useEffect, useMemo, useRef, useCallback, RefObject } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import * as FileSystem from 'expo-file-system';
import { Image, ImageRef, ImageStyle, useImage } from 'expo-image';
import { availableFilters } from '@/lib/post-editor/const';
import { Slider } from '@/components/nativewindui/Slider';
import { Fullscreen, SquareDashed } from 'lucide-react-native';
import ImageCropPicker from 'react-native-image-crop-picker';

type AppliedFilter = {
    name: string;
    amount: number;
};

type EditImageStore = {
    imageUri: string | null;
    editedImageUri: string | null;
    activeFilters: AppliedFilter[];
    setImageUri: (uri: string) => void;
    setEditedImageUri: (uri: string) => void;
    setActiveFilters: (filters: AppliedFilter[]) => void;
    reset: () => void;
};

export const useEditImageStore = create<EditImageStore>((set, get) => ({
    imageUri: null,
    editedImageUri: null,
    activeFilters: [],

    setImageUri: (uri) => set({ imageUri: uri }),
    setEditedImageUri: (uri) => set({ editedImageUri: uri }),
    setActiveFilters: (filters) => set({ activeFilters: filters }),
    reset: () => set({ imageUri: null, editedImageUri: null, activeFilters: [] }),
}));

const viewShotRefAtom = atom<RefObject<ViewShot> | null, [RefObject<ViewShot> | null], void>(null, (get, set, viewShot) => {
    set(viewShotRefAtom, viewShot);
});

const activeFilterAtom = atom<AppliedFilter | null, [AppliedFilter | null], void>(null, (get, set, filter) => {
    set(activeFilterAtom, filter);
});

export default function EditImageTool() {
    const imageUri = useEditImageStore((s) => s.imageUri);

    // useEffect(() => {
    //     return resetStore;
    // }, [])

    const originalImageUri = useEditImageStore((s) => s.imageUri);
    const editedImageUri = useEditImageStore((s) => s.editedImageUri);

    const effectiveUri = editedImageUri || originalImageUri;

    const image = useImage({ uri: effectiveUri });

    if (!imageUri) return null;

    return (
        <>
            <View className="w-full flex-1 flex-col gap-4 bg-black" style={{ height: '100%' }}>
                <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <PreviewWithFilters image={image} />
                </View>

                <View className="flex-col gap-2">
                    <Filters />
                    <Actions />
                </View>
            </View>
            <ImageWithAppliedFilters image={image} />
        </>
    );
}

export function Actions() {
    const viewShotRef = useAtomValue(viewShotRefAtom);
    const editImageState = useEditImageStore();
    const setEditedImageUri = useEditImageStore((s) => s.setEditedImageUri);
    const activeFilter = useAtomValue(activeFilterAtom);
    const [imageUri, setEditImageUri] = useEditImageStore((s) => [s.imageUri, s.setImageUri]);

    const filtersApplied = useMemo(() => {
        if (activeFilter || editImageState.activeFilters.length > 0) return true;
        return false;
    }, [activeFilter, editImageState.activeFilters.length]);

    const cropped = useMemo(() => {
        return !!editImageState.editedImageUri;
    }, [editImageState.editedImageUri]);

    const resetStore = useEditImageStore((s) => s.reset);

    const onComplete = useCallback(() => {
        resetStore();
    }, [resetStore]);

    const handleContinue = useCallback(async () => {
        try {
            if (!cropped && !filtersApplied) {
                const newState = [...media];
                newState[editingIndex].uris.unshift(imageUri);
                await setMedia(newState);
                setEditImageUri(null);
            } else {
                if (!filtersApplied) {
                    const newState = [...media];
                    newState[editingIndex].uris.unshift(editImageState.editedImageUri);
                    editImageState.setEditedImageUri(null);
                    await setMedia(newState);
                } else {
                    if (!viewShotRef?.current) {
                        alert("You've discovered an Olas bug. Congrats! Can you tell Pablo?");
                        return;
                    }

                    const uri = await viewShotRef.current.capture();
                    const filename = `${FileSystem.cacheDirectory}filtered-${Date.now()}.jpg`;
                    await FileSystem.copyAsync({
                        from: uri,
                        to: filename,
                    });

                    const newState = [...media];
                    newState[editingIndex].uris.unshift(uri);
                    await setMedia(newState);
                }
            }

            setEditingIndex(null);
            setEditedImageUri(null);
            onComplete();
        } catch (error) {
            console.error('Error in handleContinue:', error);
            alert('Failed to process image. Please try again.');
        }
    }, [
        cropped,
        filtersApplied,
        media,
        editingIndex,
        imageUri,
        editImageState,
        viewShotRef,
        setMedia,
        setEditImageUri,
        setEditingIndex,
        setEditedImageUri,
        onComplete
    ]);

    return (
        <View className="w-full flex-col p-4 pt-0">
            <Button variant="primary" size="lg" style={styles.applyButton} onPress={handleContinue}>
                <Text className="py-2 font-bold text-white">Continue</Text>
            </Button>

            <Button variant="plain" style={styles.applyButton} onPress={onComplete}>
                <Text className="py-2 font-bold text-white">Cancel</Text>
            </Button>
        </View>
    );
}

export function PreviewWithFilters({ image }: { image: ImageRef }) {
    const activeFilters = useEditImageStore((s) => s.activeFilters);

    const activeFilter = useAtomValue(activeFilterAtom);

    const imageWidth = Dimensions.get('screen').width;
    const imageHeight = image?.height ? imageWidth * (image?.height / image?.width) : 0;
    const aspectRatio = image?.width / image?.height;

    const style = { flex: 1, width: imageWidth, aspectRatio };

    if (!image || !imageHeight) {
        return null;
    }

    const activeFilterSetting = activeFilter ? availableFilters[activeFilter.name] : null;
    const ActiveFilterComponent = activeFilterSetting?.component;

    return (
        <View style={{ width: imageWidth, aspectRatio }}>
            {ActiveFilterComponent ? (
                <ActiveFilterComponent amount={activeFilter?.amount} style={style}>
                    <RecursiveFilters index={0} filters={activeFilters} image={image} style={style} />
                </ActiveFilterComponent>
            ) : (
                <RecursiveFilters index={0} filters={activeFilters} image={image} style={style} />
            )}
        </View>
    );
}

export function ImageWithAppliedFilters({ image }: { image: ImageRef }) {
    const ref = useRef<ViewShot>(null);
    const activeFilters = useEditImageStore((s) => s.activeFilters);
    const setViewShotRef = useSetAtom(viewShotRefAtom);

    // Set viewShotRef only once on mount
    useEffect(() => {
        setViewShotRef(ref);
        // Cleanup on unmount
        return () => setViewShotRef(null);
    }, []); // Empty dependency array since we only want this to run once

    const activeFilter = useAtomValue(activeFilterAtom);

    const imageWidth = Dimensions.get('screen').width;
    const imageHeight = image?.height ? imageWidth * (image?.height / image?.width) : 0;

    const style = { width: imageWidth, height: imageHeight };

    if (!image || !imageHeight) {
        return null;
    }

    const activeFilterSetting = activeFilter ? availableFilters[activeFilter.name] : null;
    const ActiveFilterComponent = activeFilterSetting?.component;

    return (
        <ViewShot
            ref={ref}
            options={{ format: 'jpg', quality: 1.0 }}
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                zIndex: -1,
                width: imageWidth,
                height: imageHeight,
                backgroundColor: 'transparent',
            }}>
            {ActiveFilterComponent && (
                <ActiveFilterComponent amount={activeFilter?.amount} style={style}>
                    <RecursiveFilters index={0} filters={activeFilters} image={image} style={style} />
                </ActiveFilterComponent>
            )}
        </ViewShot>
    );
}

function RecursiveFilters({
    index,
    filters,
    image,
    style,
}: {
    index: number;
    filters: AppliedFilter[];
    image: ImageRef;
    style: ImageStyle;
}) {
    const filter = filters[index];

    if (!filter) return <Image source={image} style={style} contentFit="contain" />;

    const filterSetting = availableFilters[filter.name];

    const FilterComponent = filterSetting.component;

    return (
        <FilterComponent amount={filterSetting.hasAmount ? filter.amount : undefined}>
            <RecursiveFilters index={index + 1} filters={filters} image={image} style={style} />
        </FilterComponent>
    );
}

// function AppliedFilter({
//     children,
//     filter,
//     amount,
//     ...props
// }: {
//     children: React.ReactNode;
//     filter: FilterSetting;
//     amount: number;
//     [key: string]: any;
// }) {
//     const Filter = filter.component;

//     return (
//         <Filter amount={amount}>{children}</Filter>
//     );
// }

function FilterButton({
    filter,
    name,
    active,
    onPress,
    image,
    style,
}: {
    filter: { component: React.ComponentType<{ amount?: number }>; hasAmount: boolean } | null;
    name: string;
    active: boolean;
    onPress: () => void;
    image: ImageRef;
    style: any;
}) {
    const FilterComponent = filter?.component;

    return (
        <Pressable onPress={onPress} className="flex-col items-center justify-center overflow-hidden" style={styles.filterButtonContainer}>
            {FilterComponent ? (
                <FilterComponent style={style} amount={1}>
                    <Image source={image} style={style} />
                </FilterComponent>
            ) : (
                <Image source={image} style={style} />
            )}
            <Text
                numberOfLines={1}
                className="mt-2 text-xs text-white"
                style={{ fontWeight: active ? 'bold' : 'normal', overflow: 'hidden' }}>
                {name}
            </Text>
        </Pressable>
    );
}

export function Filters() {
    const originalImageUri = useEditImageStore((s) => s.imageUri);
    const buttonStyle = useMemo(() => ({ width: 80, height: 70, borderRadius: 10 }), []);
    const [activeFilter, setActiveFilter] = useAtom(activeFilterAtom);
    const setEditedImageUri = useEditImageStore((s) => s.setEditedImageUri);

    const originalImage = useImage({ uri: originalImageUri });

    const width = originalImage?.width;
    const height = originalImage?.height;

    const imageWidth = Dimensions.get('screen').width;
    const imageHeight = width ? imageWidth * (height / width) : 0;

    const debouncedSetFilterAmount = useRef<NodeJS.Timeout>();
    const handleFilterAmountChange = useCallback(
        (value: number) => {
            if (debouncedSetFilterAmount.current) {
                clearTimeout(debouncedSetFilterAmount.current);
            }
            debouncedSetFilterAmount.current = setTimeout(() => {
                setActiveFilter({ name: activeFilter?.name, amount: value });
            }, 50);
        },
        [activeFilter, setActiveFilter]
    );

    const activeImagePath = media[editingIndex].uris?.[0];

    const crop = useCallback(
        async (options: any) => {
            try {
                const croppedImage = await ImageCropPicker.openCropper({
                    path: activeImagePath,
                    freeStyleCropEnabled: true,
                    width: imageWidth,
                    height: imageHeight,
                    cropperToolbarTitle: 'Crop Image',
                    ...options,
                });

                setEditedImageUri(croppedImage.path);
            } catch (error) {
                console.error('Error cropping image:', error);
            }
        },
        [activeImagePath, imageWidth, imageHeight]
    );

    return (
        <View style={styles.toolsContainer}>
            <View className="w-full px-4" style={{ height: 30 }}>
                {activeFilter && availableFilters[activeFilter.name].hasAmount && (
                    <Slider
                        value={activeFilter.amount}
                        onValueChange={handleFilterAmountChange}
                        minimumValue={0}
                        minimumTrackTintColor="#ffffff33"
                        maximumValue={1}
                        step={0.01}
                    />
                )}
            </View>

            <View style={styles.filtersContainer}>
                <ScrollView horizontal>
                    <FilterButton
                        filter={null}
                        name="Original"
                        active={activeFilter === null}
                        onPress={() => setActiveFilter(null)}
                        image={originalImage}
                        style={buttonStyle}
                    />
                    {Object.entries(availableFilters).map(([key, { component, hasAmount }]) => (
                        <FilterButton
                            key={key}
                            filter={hasAmount ? { component, hasAmount } : { component, hasAmount }}
                            name={key}
                            active={activeFilter?.name === key}
                            onPress={() => setActiveFilter({ name: key, amount: 1 })}
                            image={originalImage}
                            style={buttonStyle}
                        />
                    ))}
                </ScrollView>
            </View>

            <View className="w-full flex-row items-center justify-center gap-6">
                <Pressable
                    style={styles.cropButton}
                    onPress={() =>
                        crop({
                            width: imageWidth,
                            height: imageWidth,
                        })
                    }>
                    <SquareDashed size={32} color="white" />
                    <Text className="text-xs text-white">Square</Text>
                </Pressable>

                <Pressable
                    style={styles.cropButton}
                    onPress={() =>
                        crop({
                            width: imageWidth,
                            height: imageHeight,
                        })
                    }>
                    <Fullscreen size={32} color="white" />
                    <Text className="text-xs text-white">Zoom / Crop</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    toolsContainer: {
        flexDirection: 'column',
        width: '100%',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filtersContainer: {
        height: 100,
        width: '100%',
    },
    applyButton: {
        width: '100%',
    },

    filterButtonContainer: {
        width: 80,
        height: 100,
        padding: 5,
        marginHorizontal: 10,
        borderRadius: 18,
    },

    cropButton: {
        width: 140,
        height: 40,
        borderRadius: 10,
        padding: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
});
