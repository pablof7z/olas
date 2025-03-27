import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

import { optionsMenuEventAtom, optionsSheetRefAtom } from '~/components/events/Post/store';

export function usePostBottomSheet() {
    const setOptionsMenuEvent = useSetAtom(optionsMenuEventAtom);
    const optionsSheetRef = useAtomValue(optionsSheetRefAtom);

    const openMenu = useCallback(
        (event: NDKEvent) => {
            setOptionsMenuEvent(event);
            optionsSheetRef.current?.present();
        },
        [optionsSheetRef]
    );

    return openMenu;
}
