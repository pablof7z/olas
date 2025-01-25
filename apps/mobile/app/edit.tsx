import { atom, useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, Modal, Pressable, SafeAreaView, ScrollView, View, StyleSheet } from "react-native";
import ImageCropPicker from 'react-native-image-crop-picker';
import { Image, ImageRef, useImage } from "expo-image";
import { Text } from "@/components/nativewindui/Text";
import { Slider } from "@/components/nativewindui/Slider";
import ViewShot from "react-native-view-shot";
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
    Sepia,
    Polaroid,
    Kodachrome,
    Grayscale,
    Warm,
    Cool,
    Browni,
    Achromatopsia,
    Deuteranopia,
    Tritanopia,
    DuoTone,
    Contrast,
    Invert,
    Saturate,
    HueRotate,
    Temperature,
} from 'react-native-color-matrix-image-filters';
import { Fullscreen, Square, SquareDashed, ZoomIn } from "lucide-react-native";
import { Button } from "@/components/nativewindui/Button";

type EditImageCallback = ((image: string) => void) | null;

export const editImageAtom = atom<string>("");
export const editCallbackAtom = atom<EditImageCallback, [EditImageCallback | null], null>(null, (get, set, callback) => {
    set(editCallbackAtom, callback);
});

const filters = {
    "Sepia": Sepia,
    "Browni": Browni,
    "Polaroid": Polaroid,
    "Kodachrome": Kodachrome,
    "Grayscale": Grayscale,
    "Warm": Warm,
    "Cool": Cool,
    "Achromatopsia": Achromatopsia,
    "Deuteranopia": Deuteranopia,
    "Tritanopia": Tritanopia,
    "DuoTone": DuoTone,
    "Contrast": Contrast,
    "Invert": Invert,
    "Saturate": Saturate,
    "HueRotate": HueRotate,
    "Temperature": Temperature,
};

function ImageWithFilter({
    children,
    filter: Filter,
    amount,
    ...props
}: {
    children: React.ReactNode;
    filter: React.ComponentType<{ amount?: number }>;
    amount: number;
    [key: string]: any;
}) {
    return (
        <Filter amount={amount}>{children}</Filter>
    );
}

function FilterButton({
    filter: Filter,
    name,
    active,
    onPress,
    image,
    style,
}: {
    filter: React.ComponentType<{ amount?: number }> | null;
    name: string;
    active: boolean;
    onPress: () => void;
    image: ImageRef;
    style: any;
}) {
    
    return (
        <Pressable
            onPress={onPress}
            className="flex-col items-center justify-center overflow-hidden"
            style={{ width: 140, height: 150 }}
        >
            {Filter ? (
                <ImageWithFilter style={style} filter={Filter} amount={1}>
                    <Image source={image} style={style} />
                </ImageWithFilter>
            ) : (
                <Image source={image} style={style} />
            )}
            <Text 
                className="text-white text-xs mt-2"
                style={{ fontWeight: active ? 'bold' : 'normal', borderRadius: 10, overflow: 'hidden' }}
            >
                {name}
            </Text>
        </Pressable>
    );
}

export default function EditScreen() {
    const [editImage, setEditImage] = useAtom(editImageAtom);
    const callback = useAtomValue(editCallbackAtom);
    const [activeFilter, setActiveFilter] = useState<React.ComponentType<{ amount?: number }> | null>(null);
    const [filterAmount, setFilterAmount] = useState(0);

    // Debounced filter amount setter
    const debouncedSetFilterAmount = useRef<NodeJS.Timeout>();
    const handleFilterAmountChange = (value: number) => {
        if (debouncedSetFilterAmount.current) {
            clearTimeout(debouncedSetFilterAmount.current);
        }
        debouncedSetFilterAmount.current = setTimeout(() => {
            setFilterAmount(value);
        }, 50);
    };
    const viewShotRef = useRef<ViewShot>(null);
    const insets = useSafeAreaInsets();
    
    const style = { borderRadius: 18, width: 125, height: 125 }; // Square aspect ratio for now

    const image = useImage({ uri: editImage });

    const width = image?.width;
    const height = image?.height;

    console.log({ width, height });

    const imageWidth = Dimensions.get('screen').width;
    const imageHeight = imageWidth * (height / width);

    const saveFilteredImage = async () => {
        if (!viewShotRef.current || !activeFilter) return;
        
        try {
            // Capture the filtered image
            const uri = await viewShotRef.current.capture();
            
            // Generate a unique filename
            const filename = `${FileSystem.cacheDirectory}filtered-${Date.now()}.jpg`;
            
            // Copy the file to our desired location
            await FileSystem.copyAsync({
                from: uri,
                to: filename
            });

            console.log('Image saved to:', filename);

            // Call the callback with the new image URI
            if (callback) {
                console.log('calling callback', filename);
                callback(filename);
            } else {
                console.log('no callback');
            }

            // Go back
            router.back();
        } catch (error) {
            console.error('Error saving filtered image:', error);
        }
    };

    const crop = useCallback(async (options: any) => {
        try {
            const croppedImage = await ImageCropPicker.openCropper({
                path: editImage,
                freeStyleCropEnabled: true,
                width: imageWidth,
                height: imageHeight,
                cropperToolbarTitle: 'Crop Image',
                ...options,
            });
            
            setEditImage(croppedImage.path);
        } catch (error) {
            console.error('Error cropping image:', error);
        }
    }, [editImage, imageWidth, imageHeight]);

    const areaStyle = useMemo(() => ({
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
    }), [insets]);

    if (!image || !width || !height) return null;

    return (
        <SafeAreaView className="flex-1 items-center justify-end bg-black flex-col w-full gap-4" style={areaStyle}>
            <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, width: imageWidth, height: imageHeight, backgroundColor: 'transparent' }}>
                {activeFilter ? (
                    <ImageWithFilter filter={activeFilter} amount={filterAmount}>
                        <Image source={image} style={{ width: imageWidth, height: imageHeight }} contentFit="contain" />
                    </ImageWithFilter>
                ) : (
                    <Image source={image} style={{ width: imageWidth, height: imageHeight }} contentFit="contain" />
                )}
            </ViewShot>

            <View className="flex-1" />

            <View style={styles.toolsContainer}>
                <View className="w-full px-4">
                    {activeFilter && (
                        <Slider
                            value={filterAmount}
                            onValueChange={handleFilterAmountChange}
                            minimumValue={0}
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
                            image={image}
                            style={style}
                        />
                        {Object.entries(filters).map(([key, Filter]) => (
                            <FilterButton
                                key={key}
                                filter={Filter}
                                name={key}
                                active={activeFilter === Filter}
                                onPress={() => setActiveFilter(Filter)}
                                image={image}
                                style={style}
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

                <View className="flex-col w-full pt-0 p-4">
                    <Button 
                        variant="primary"
                        size="lg"
                        style={styles.applyButton}
                        onPress={saveFilteredImage}
                    >
                        <Text className="text-white font-bold py-2">Apply</Text>
                    </Button>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    toolsContainer: {
        paddingTop: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        flexDirection: 'column',
        width: '100%',
        gap: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filtersContainer: {
        height: 150,
    },
    applyButton: {
        width: '100%',
    },
    cropButton: {
        width: 100,
        height: 100,
        borderRadius: 18,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
});