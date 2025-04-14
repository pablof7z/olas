import type { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk-mobile';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';

import { zapperModalTargetAtom } from '.';
import { zapperBottomSheetRefAtom } from './bottom-sheet';

export function useZapperModal() {
    const bottomSheetRef = useAtomValue(zapperBottomSheetRefAtom);
    const setZapperModalTarget = useSetAtom(zapperModalTargetAtom);

    const open = useCallback(
        (target: NDKEvent | NDKUser) => {
            setZapperModalTarget(target);
            bottomSheetRef?.current?.present();
        },
        [bottomSheetRef]
    );

    return open;
}
