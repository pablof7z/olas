import { atom, useSetAtom } from "jotai";
import { Sheet, useSheetRef } from "@/components/nativewindui/Sheet";
import { RefObject, useEffect } from "react";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Zapper from ".";

type ZapperBottomSheetRef = RefObject<BottomSheetModal> | null;
export const zapperBottomSheetRefAtom = atom<ZapperBottomSheetRef, [ZapperBottomSheetRef], void>(null, (get, set, value) => {
    set(zapperBottomSheetRefAtom, value);
});

export default function ZapperBottomSheet() {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(zapperBottomSheetRefAtom);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        setBottomSheetRef(ref);
    }, [ref, setBottomSheetRef]);

    return (
        <Sheet ref={ref} snapPoints={['50%']} maxDynamicContentSize={Dimensions.get('window').height * 0.7}>
            <BottomSheetView
                style={{ flexDirection: 'column', width: '100%', paddingHorizontal: 20, paddingBottom: insets.bottom, minHeight: 370 }}
            >
                <Zapper
                    onClose={() => ref?.current?.dismiss()}
                />
            </BottomSheetView>
        </Sheet>
    )
}
