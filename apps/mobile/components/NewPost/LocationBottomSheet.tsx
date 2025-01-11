import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Text } from '@/components/nativewindui/Text';
import { RefObject, useCallback, useEffect, useMemo } from 'react';
import { atom, useAtom, useSetAtom } from 'jotai';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { metadataAtom } from '@/components/NewPost/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, View } from 'react-native';
import { MapPin, MapPinMinus, Type } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { Button } from '@/components/nativewindui/Button';
import { useAppSettingsStore } from '@/stores/app';

type LocationBottomSheetRefAtomType = RefObject<BottomSheetModal> | null;
export const locationBottomSheetRefAtom = atom<LocationBottomSheetRefAtomType, [LocationBottomSheetRefAtomType], null>(
    null,
    (get, set, value) => set(locationBottomSheetRefAtom, value)
);

export function LocationBottomSheet() {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(locationBottomSheetRefAtom);
    const inset = useSafeAreaInsets();
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const { colors } = useColorScheme();
    const setAppSettingRemoveLocation = useAppSettingsStore((state) => state.setRemoveLocation);

    useEffect(() => {
        setBottomSheetRef(ref);

        return () => {
            console.log('unmounting location bottom sheet');
            setBottomSheetRef(null);
        };
    }, [ref, setBottomSheetRef]);

    const changeValue = useCallback(
        (value: boolean) => {
            setMetadata({ ...metadata, removeLocation: value });
            setAppSettingRemoveLocation(value);
            ref.current?.dismiss();
        },
        [metadata, setMetadata, ref, setAppSettingRemoveLocation]
    );

    return (
        <Sheet ref={ref} snapPoints={['50%']} maxDynamicContentSize={Dimensions.get('window').height * 0.7}>
            <BottomSheetView
                style={{ flexDirection: 'column', width: '100%', paddingHorizontal: 20, paddingBottom: inset.bottom, minHeight: 370 }}>
                <Text variant="title1" className="text-grow text-foreground">
                    Location Sharing
                </Text>

                <View className="w-full flex-1 flex-col items-stretch gap-4 mt-4">
                    <View className="w-full flex-1 flex-col items-stretch gap-4 pb-8">
                        <Button size="huge" variant="secondary" className="flex-col items-start gap-2 p-4" onPress={() => changeValue(false)}>
                            <View className="flex-row items-center gap-2">
                                <MapPin size={48} color={colors.muted} />
                                <View className="w-full flex-col gap-0">
                                    <Text variant="caption1" className="text-lg font-bold">
                                        Share location
                                    </Text>
                                    <Text className="text-sm text-muted-foreground">Share where this moment happened.</Text>
                                </View>
                            </View>
                        </Button>

                        <Button size="huge" variant="secondary" className="flex-col items-start gap-2 p-4" onPress={() => changeValue(true)}>
                            <View className="flex-row items-center gap-2">
                                <MapPinMinus size={48} color={colors.muted} />
                                <View className="flex-col gap-0">
                                    <Text variant="caption1" className="text-lg font-bold">
                                        Remove Location
                                    </Text>
                                    <Text className="text-sm text-muted-foreground">Remove location from your post.</Text>
                                </View>
                            </View>
                        </Button>
                    </View>

                    <View style={{ paddingTop: 16, marginBottom: inset.bottom * 2 }}>
                        <Text variant="caption1" className="text-sm text-muted-foreground">
                            Note: Location accuracy is reduced to about 600 meters.
                        </Text>
                    </View>
                </View>
            </BottomSheetView>
        </Sheet>
    );
}
