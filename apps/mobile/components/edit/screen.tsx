import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useRef, useState, useCallback, RefObject, act } from "react";
import { Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import ViewShot from "react-native-view-shot";
import { Button } from "../nativewindui/Button";
import { Text } from "../nativewindui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import { Image, ImageRef, ImageStyle, useImage } from "expo-image";
import { availableFilters, FilterSetting } from "./const";
import { AppliedFilter, useEditImageStore } from "./store";
import { Slider } from "../nativewindui/Slider";
import { Fullscreen, SquareDashed } from "lucide-react-native";
import ImageCropPicker from "react-native-image-crop-picker";

const viewShotRefAtom = atom<RefObject<ViewShot> | null, [RefObject<ViewShot> | null], void>(null, (get, set, viewShot) => {
    set(viewShotRefAtom, viewShot);
});

const activeFilterAtom = atom<AppliedFilter | null, [AppliedFilter | null], void>(null, (get, set, filter) => {
    set(activeFilterAtom, filter);
});

export default function EditImageTool({ onComplete } : { onComplete: () => void}) {
    const insets = useSafeAreaInsets();
    const imageUri = useEditImageStore(s => s.imageUri);
    const resetStore = useEditImageStore(s => s.reset);
    
    const areaStyle = useMemo(() => ({
        paddingBottom: 50,
    }), [insets]);

    // useEffect(() => {
    //     return resetStore;
    // }, [])

    if (!imageUri) return null;

    return (
        <SafeAreaView className="flex-1 items-stretch justify-between bg-black flex-col w-full gap-4">
            <ImageWithAppliedFilters />

            <View className="flex-col gap-2 w-fill absolute bottom-0 left-0 right-0">
                <Filters style={styles.filtersContainer} />
                
                <Actions onComplete={onComplete} />
            </View>
        </SafeAreaView>
    )
}

export function Actions({ onComplete }: { onComplete: () => void}) {
    const viewShotRef = useAtomValue(viewShotRefAtom);
    const editImageState = useEditImageStore();
    const activeFilter = useAtomValue(activeFilterAtom);

    const filtersApplied = useMemo(() => {
        if (activeFilter || editImageState.activeFilters.length > 0) return true;
        return false;
    }, [ activeFilter, editImageState.activeFilters.length ])

    const cropped = useMemo(() => {
        return !!editImageState.editedImageUri;
    }, [ editImageState.editedImageUri ])

    useEffect(() => {
        console.log('does actions have a ref?', !!viewShotRef, !!viewShotRef?.current)
    }, [ viewShotRef?.current ])

    const handleContinue = useCallback(async () => {
        if (!cropped && !filtersApplied) { 
            if (editImageState.cb)
                editImageState.cb(editImageState.imageUri);
        } else {
            if (!viewShotRef.current) {
                alert("You've discovered an Olas bug. Congrats! Can you tell Pablo?")
                return;
            }

            try {
                const uri = await viewShotRef.current.capture();
                const filename = `${FileSystem.cacheDirectory}filtered-${Date.now()}.jpg`;
                await FileSystem.copyAsync({
                    from: uri,
                    to: filename
                });

                editImageState.setEditedImageUri(uri);

                if (editImageState.cb)
                    editImageState.cb(uri)
            } catch (error) {
                console.error('Error saving filtered image:', error);
            }
        }

        onComplete();
    }, [editImageState, filtersApplied, onComplete, viewShotRef?.current])
    
    return (
        <View className="flex-col w-full pt-0 p-4">
            <Button 
                variant="primary"
                size="lg"
                style={styles.applyButton}
                onPress={handleContinue}
            >
                <Text className="text-white font-bold py-2">
                    Continue
                </Text>
            </Button>

            <Button 
                variant="plain"
                style={styles.applyButton}
                onPress={onComplete}
            >
                <Text className="text-white font-bold py-2">
                    Cancel
                </Text>
            </Button>
        </View>
    );
}

export function ImageWithAppliedFilters() {
    const originalImageUri = useEditImageStore(s => s.imageUri);
    const editedImageUri = useEditImageStore(s => s.editedImageUri);

    const effectiveUri = editedImageUri || originalImageUri;

    const image = useImage({ uri: effectiveUri });
    
    const ref = useRef<ViewShot>(null);
    const activeFilters = useEditImageStore(s => s.activeFilters);
    const setViewShotRef = useSetAtom(viewShotRefAtom);

    useEffect(() => {
        console.log('ref', !!ref)
        
        if (ref.current) {
            console.log('setting setViewShotRef')
            setViewShotRef(ref);
        } else {
            console.log('we dont have a ref', effectiveUri)
        }
    }, [ref.current])

    const activeFilter = useAtomValue(activeFilterAtom);

    if (!effectiveUri) {
        return null;
    }

    const imageWidth = Dimensions.get('screen').width;
    const imageHeight = image?.height ? imageWidth * (image?.height / image?.width) : 0;

    const style = { width: imageWidth, height: imageHeight };
    
    if (!image || !imageHeight) {
        console.log('no image or image height', effectiveUri, !!image, !!imageHeight)
        return null;
    }

    const activeFilterSetting = activeFilter ? availableFilters[activeFilter.name] : null;
    const ActiveFilterComponent = activeFilterSetting?.component;

    return (
        <ViewShot ref={ref} options={{ format: 'jpg', quality: 1.0 }} style={{ width: imageWidth, height: imageHeight, backgroundColor: 'transparent' }}>
            {ActiveFilterComponent ? (
                <ActiveFilterComponent amount={activeFilter?.amount}>
                    <RecursiveFilters index={0} filters={activeFilters} image={image} style={style} />
                </ActiveFilterComponent>
            ) : (
                <RecursiveFilters index={0} filters={activeFilters} image={image} style={style} />
            )}
        </ViewShot>
    )

    // {activeFilter ? (
            //     <ImageWithFilter filter={activeFilter.component} amount={activeFilter.hasAmount ? filterAmount : undefined}>
            //         <Image source={image} style={{ width: imageWidth, height: imageHeight }} contentFit="contain" />
            //     </ImageWithFilter>
            // ) : (
            //     <Image source={image} style={{ width: imageWidth, height: imageHeight }} contentFit="contain" />
            // )}
}

function RecursiveFilters({ index, filters, image, style }: { index: number, filters: AppliedFilter[], image: ImageRef, style: ImageStyle }) {
    const filter = filters[index];

    if (!filter) return <Image source={image} style={{ width: '100%', height: '100%' }} contentFit="contain" />
    
    const filterSetting = availableFilters[filter.name];
    
    const FilterComponent = filterSetting.component;

    return (
        <FilterComponent amount={filterSetting.hasAmount ? filter.amount : undefined}>
            <RecursiveFilters index={index + 1} filters={filters} image={image} style={style} />
        </FilterComponent>
    )
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
    filter: { component: React.ComponentType<{ amount?: number }>, hasAmount: boolean } | null;
    name: string;
    active: boolean;
    onPress: () => void;
    image: ImageRef;
    style: any;
}) {
    const FilterComponent = filter?.component;

    return (
        <Pressable
            onPress={onPress}
            className="flex-col items-center justify-center overflow-hidden"
            style={styles.filterButtonContainer}
        >
            {FilterComponent ? (
                <FilterComponent style={style} amount={1}>
                    <Image source={image} style={style} />
                </FilterComponent>
            ) : (
                <Image source={image} style={style} />
            )}
            <Text 
                numberOfLines={1}
                className="text-white text-xs mt-2"
                style={{ fontWeight: active ? 'bold' : 'normal', overflow: 'hidden' }}
            >
                {name}
            </Text>
        </Pressable>
    );
}

export function Filters({ style }: { activeFilter?: string, style: ImageStyle }) {
    const originalImageUri = useEditImageStore(s => s.imageUri);
    const editedImageUri = useEditImageStore(s => s.editedImageUri);
    const buttonStyle = useMemo(() => ({ width: 80, height: 70, borderRadius: 10 }), []);
    const [activeFilter, setActiveFilter] = useAtom(activeFilterAtom);
    const setEditedImageUri = useEditImageStore(s => s.setEditedImageUri);

    const originalImage = useImage({ uri: originalImageUri });

    const width = originalImage?.width;
    const height = originalImage?.height;

    const imageWidth = Dimensions.get('screen').width;
    const imageHeight = width ? imageWidth * (height / width) : 0;

    const debouncedSetFilterAmount = useRef<NodeJS.Timeout>();
    const handleFilterAmountChange = useCallback((value: number) => {
        if (debouncedSetFilterAmount.current) {
            clearTimeout(debouncedSetFilterAmount.current);
        }
        debouncedSetFilterAmount.current = setTimeout(() => {
            setActiveFilter({ name: activeFilter?.name, amount: value });
        }, 50);
    }, [activeFilter, setActiveFilter]);

    const activeImagePath = editedImageUri || originalImageUri;

    const crop = useCallback(async (options: any) => {
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
    }, [activeImagePath, imageWidth, imageHeight]);
    
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

            <View className="flex-row items-center justify-center gap-6 w-full">
                <Pressable style={styles.cropButton} onPress={() => crop({
                    width: imageWidth,
                    height: imageWidth,
                })}>
                    <SquareDashed size={32} color="white" />
                    <Text className="text-white text-xs">Square</Text>
                </Pressable>

                <Pressable style={styles.cropButton} onPress={() => crop({
                    width: imageWidth,
                    height: imageHeight,
                })}>
                    <Fullscreen size={32} color="white" />
                    <Text className="text-white text-xs">Zoom / Crop</Text>
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
        height: 120,
        width: '100%',
    },
    applyButton: {
        width: '100%',
    },

    filterButtonContainer: {
        width: 100,
        height: 120,
        padding: 5,
        margin: 10,
        borderRadius: 18,
    },
    
    cropButton: {
        width: 90,
        height: 80,
        borderRadius: 18,
        padding: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
});