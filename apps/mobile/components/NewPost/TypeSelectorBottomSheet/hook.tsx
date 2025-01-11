import { useAtomValue } from "jotai";
import { postTypeSelectorSheetRefAtom } from "./store";
import { useCallback } from "react";
import { useAlbums } from '@/components/albums/hook';

export function usePostTypeSelectorBottomSheet() {
    const ref = useAtomValue(postTypeSelectorSheetRefAtom);

    const openNewPostTypeSelector = useCallback(() => {
        if (!ref?.current) return;
        ref.current.present();
        ref.current.expand();
    }, [ref?.current]);

    return openNewPostTypeSelector;
}