import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { useAtomValue } from 'jotai';
import { commentBottomSheetRefAtom } from '@/components/Comments/BottomSheet';
import { activeEventStore } from '@/app/stores';

export function useComments(event: NDKEvent) {
    const bottomSheetRef = useAtomValue(commentBottomSheetRefAtom);
    const setActiveEvent = activeEventStore((s) => s.setActiveEvent);

    const openComments = () => {
        setActiveEvent(event);
        bottomSheetRef?.current?.present();
    };

    return openComments;
}
