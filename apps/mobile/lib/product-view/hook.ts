import { useAtomValue, useSetAtom } from "jotai";
import { productEventAtom, productViewSheetRefAtom } from "./store";
import { useCallback } from "react";
import type { NDKEvent } from "@nostr-dev-kit/ndk-mobile";

export function useProductView() {
    const setProductEvent = useSetAtom(productEventAtom);
    const sheetRef = useAtomValue(productViewSheetRefAtom);

    const openProductView = useCallback((event: NDKEvent) => {
        setProductEvent(event);
        sheetRef?.current?.present();
        sheetRef?.current?.expand();
    }, [sheetRef]);

    return openProductView;
} 