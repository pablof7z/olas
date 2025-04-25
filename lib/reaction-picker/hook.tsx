import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

import { reactionPickerCallbackAtom, sheetAtom } from './bottom-sheet';

export function useReactionPicker() {
    const reactionPickerSheet = useAtomValue(sheetAtom);
    const setReactionPickerCallback = useSetAtom(reactionPickerCallbackAtom);

    const choose = useCallback(() => {
        return new Promise<string>((resolve) => {
            setReactionPickerCallback((emoji) => resolve(emoji));
            reactionPickerSheet.present();
        });
    }, [setReactionPickerCallback, reactionPickerSheet]);

    return choose;
}
