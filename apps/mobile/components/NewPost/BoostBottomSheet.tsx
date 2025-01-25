import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Text } from '@/components/nativewindui/Text';
import { RefObject, useEffect, useMemo } from 'react';
import { atom, useAtom, useSetAtom } from 'jotai';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, View } from 'react-native';

export type Boost = {
    id: string;
    type: 'photo' | 'video';
    uri: string;
};

type BoostSheetRefAtomType = RefObject<BottomSheetModal> | null;

export const boostSheetRefAtom = atom<BoostSheetRefAtomType, [BoostSheetRefAtomType], null>(null, (get, set, value) =>
    set(boostSheetRefAtom, value)
);

export function BoostBottomSheet() {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(boostSheetRefAtom);
    const inset = useSafeAreaInsets();

    useEffect(() => {
        setBottomSheetRef(ref);
    }, [ref, setBottomSheetRef]);

    return (
        <Sheet ref={ref}>
            <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: inset.bottom }}>
                <Text variant="title1">Backwards Compatible Post</Text>

                <View className="w-full flex-1 flex-col items-stretch gap-4">
                    <Text className="text-muted-foreground">
                        Nostr posts can be published in a wide variety of formats. When using the Boost option,
                        your post will be published a microblog format (i.e. kind 1).
                    </Text>

                    <View className="mb-8"></View>
                </View>
            </BottomSheetView>
        </Sheet>
    );
}
