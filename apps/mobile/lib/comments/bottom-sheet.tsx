import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect } from 'react';

import Comments from './index';
import { replyEventAtom, rootEventAtom } from './store';

import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
export const sheetAtom = atom<BottomSheetModal, [BottomSheetModal], void>(null, (get, set, value) => {
    set(sheetAtom, value);
});

export function useCommentBottomSheet() {
    const sheet = useAtomValue(sheetAtom);
    const setRootEvent = useSetAtom(rootEventAtom);
    const setReplyEvent = useSetAtom(replyEventAtom);

    const open = useCallback(
        (root: NDKEvent, reply?: NDKEvent) => {
            if (!sheet) return;
            sheet.present();
            sheet.snapToPosition(800);
            setRootEvent(root);
            setReplyEvent(reply);
        },
        [sheet]
    );

    return open;
}

export default function CommentsBottomSheet() {
    const sheetRef = useSheetRef();
    const setSheet = useSetAtom(sheetAtom);

    useEffect(() => {
        setSheet(sheetRef.current);
    }, [sheetRef.current]);

    return (
        <Sheet ref={sheetRef} snapPoints={['50%']} enableDynamicSizing={false} index={-1}>
            <Comments />
        </Sheet>
    );
}
