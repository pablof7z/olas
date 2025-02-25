import { useAtomValue, useSetAtom } from "jotai";
import { productEventAtom, productViewSheetRefAtom } from "./store";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRef, useEffect } from "react";
import ProductView from "./index";
import { Sheet } from "@/components/nativewindui/Sheet";
import { Dimensions } from "react-native";

export function ProductViewBottomSheet() {
    const productEvent = useAtomValue(productEventAtom);
    const sheetRef = useRef<BottomSheetModal>(null);
    const setSheetRef = useSetAtom(productViewSheetRefAtom);

    useEffect(() => {
        setSheetRef(sheetRef);
    }, []);

    return (
        <Sheet ref={sheetRef}>
            <BottomSheetView
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
                {productEvent && <ProductView event={productEvent} />}
            </BottomSheetView>
        </Sheet>
    );
}
