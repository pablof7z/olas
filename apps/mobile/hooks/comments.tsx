import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { useAtomValue } from 'jotai';

import { activeEventStore } from '@/app/stores';
import { commentBottomSheetRefAtom } from '@/components/Comments/BottomSheet';

export function useComments(event: NDKEvent) {
    const bottomSheetRef = useAtomValue(commentBottomSheetRefAtom);
    const setActiveEvent = activeEventStore((s) => s.setActiveEvent);

    const openComments = () => {
        setActiveEvent(event);
        bottomSheetRef?.current?.present();
    };

    return openComments;
}
