import { atom, useAtom, useAtomValue } from "jotai";
import { useRef, useState } from "react";
import { Dimensions, Modal, Pressable, SafeAreaView, ScrollView, View } from "react-native";
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
            style={{ width: 140, height: 125 }}
        >
            {Filter ? (
                <ImageWithFilter style={style} filter={Filter} amount={0.5}>
                    <Image source={image} style={style} />
                </ImageWithFilter>
            ) : (
                <Image source={image} style={style} />
            )}
            <Text 
                className="text-white text-xs -mt-4 bg-black/50 px-2 py-1 rounded-xl" 
                style={{ fontWeight: active ? 'bold' : 'normal' }}
            >
                {name}
            </Text>
        </Pressable>
    );
}

export default function EditScreen() {
    const [editImage, setEditImage] = useAtom(editImageAtom);
    const [callback, setCallback] = useAtom(editCallbackAtom);
    const [activeFilter, setActiveFilter] = useState<React.ComponentType<{ amount?: number }> | null>(null);
    const [filterAmount, setFilterAmount] = useState(0);

    console.log('editImage hasCallback', !!callback);
    
    // Debounced filter amount setter
    const debouncedSetFilterAmount = useRef<NodeJS.Timeout>();
    const handleFilterAmountChange = (value: number) => {
        if (debouncedSetFilterAmount.current) {
            clearTimeout(debouncedSetFilterAmount.current);
        }
        debouncedSetFilterAmount.current = setTimeout(() => {
            setFilterAmount(value);
        }, 16);
    };
    const viewShotRef = useRef<ViewShot>(null);
    const insets = useSafeAreaInsets();
    
    const style = { borderRadius: 18, width: 125, height: 125 }; // Square aspect ratio for now

    const image = useImage({ uri: editImage });

    const width = image?.width;
    const height = image?.height;

    console.log({ width, height });

    if (!image || !width || !height) return null;

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

    if (!image) return null;

    return (
        <SafeAreaView className="flex-1 items-center justify-center bg-black flex-col w-full gap-4"
        >
            <View className="absolute top-4 right-4 z-10">
                <Pressable 
                    onPress={async () => {
                        try {
                            const croppedImage = await ImageCropPicker.openCropper({
                                path: editImage,
                                freeStyleCropEnabled: true,
                                width: imageWidth,
                                height: imageHeight,
                                cropperToolbarTitle: 'Crop Image',
                            });
                            
                            setEditImage(croppedImage.path);
                        } catch (error) {
                            console.error('Error cropping image:', error);
                        }
                    }}
                    className="bg-white/20 px-4 py-2 rounded-full"
                >
                    <Text className="text-white font-bold">Crop</Text>
                </Pressable>
            </View>
                    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1.0 }} style={{ width: imageWidth, height: imageHeight }}>
                        {activeFilter ? (
                            <ImageWithFilter filter={activeFilter} amount={filterAmount}>
                                <Image source={image} style={{ width: imageWidth, height: imageHeight }} contentFit="contain" />
                            </ImageWithFilter>
                        ) : (
                            <Image source={image} style={{ width: imageWidth, height: imageHeight }} contentFit="contain" />
                        )}
                    </ViewShot>
                    
                    {activeFilter && (
                        <View className="w-full px-4 gap-4 flex-1 border-t border-blue-500">
                            <Slider
                                value={filterAmount}
                                onValueChange={handleFilterAmountChange}
                                minimumValue={0}
                                maximumValue={1}
                                step={0.01}
                            />
                        </View>
                    )}

                    <ScrollView horizontal className="flex-1">
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

                    <Pressable 
                                onPress={saveFilteredImage}
                                className="bg-white/20 px-4 py-2 rounded-full items-center"
                            >
                                <Text className="text-white font-bold">Apply</Text>
                            </Pressable>
        </SafeAreaView>
    );
}