import { useAtomValue, useSetAtom } from "jotai";
import { optionsMenuEventAtom, optionsSheetRefAtom } from "~/components/events/Post/store";
import { useCallback } from "react";
import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";

export function usePostBottomSheet() {
    const setOptionsMenuEvent = useSetAtom(optionsMenuEventAtom);
    const optionsSheetRef = useAtomValue(optionsSheetRefAtom);

    const openMenu = useCallback((event: NDKEvent) => {
        setOptionsMenuEvent(event);
        optionsSheetRef.current?.present();
    }, [optionsSheetRef]);

    return openMenu;
}