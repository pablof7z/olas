import { useAtomValue } from 'jotai';
import { useCallback } from 'react';

import { sheetAtom } from './BottomSheet';

export function useFeedTypeBottomSheet() {
    const sheet = useAtomValue(sheetAtom);

    const show = useCallback(() => {
        sheet?.present();
    }, [sheet]);

    return { show };
}
