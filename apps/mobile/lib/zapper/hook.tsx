import { useSetAtom } from "jotai";
import { zapperBottomSheetRefAtom } from "./bottom-sheet";
import { useAtomValue } from "jotai";
import { NDKEvent, NDKUser } from "@nostr-dev-kit/ndk-mobile";
import { useCallback } from "react";
import { zapperModalTargetAtom } from ".";

export function useZapperModal() {
    const bottomSheetRef = useAtomValue(zapperBottomSheetRefAtom);
    const setZapperModalTarget = useSetAtom(zapperModalTargetAtom);

    const open = useCallback((target: NDKEvent | NDKUser) => {
        setZapperModalTarget(target);
        bottomSheetRef?.current?.present();
    }, [bottomSheetRef]);

    return open;
}