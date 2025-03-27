import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

import { productEventAtom, productViewSheetRefAtom } from './store';

export function useProductView() {
    const setProductEvent = useSetAtom(productEventAtom);
    const sheetRef = useAtomValue(productViewSheetRefAtom);

    const openProductView = useCallback(
        (event: NDKEvent) => {
            setProductEvent(event);
            sheetRef?.current?.present();
            sheetRef?.current?.expand();
        },
        [sheetRef]
    );

    return openProductView;
}
