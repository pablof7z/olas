import { atom, useAtomValue, useSetAtom } from "jotai";
import { Sheet, useSheetRef } from "@/components/nativewindui/Sheet";
import { BottomSheetModal, BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { useCallback, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Comments from "./index";
import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
import { replyEventAtom, rootEventAtom } from "./store";
import { StyleSheet } from "react-native";
export const sheetAtom = atom<BottomSheetModal, [BottomSheetModal], void>(null, (get, set, value) => {
    set(sheetAtom, value);
});

export function useCommentBottomSheet() {
    const sheet = useAtomValue(sheetAtom);
    const setRootEvent = useSetAtom(rootEventAtom);
    const setReplyEvent = useSetAtom(replyEventAtom);

    const open = useCallback((root: NDKEvent, reply?: NDKEvent) => {
        console.log('open', root, reply);
        if (!sheet) return;
        sheet.present();
        sheet.expand();
        setRootEvent(root);
        setReplyEvent(reply);
    }, [sheet]);

    return open;
}

export default function CommentsBottomSheet() {
    const sheetRef = useSheetRef();
    const setSheet = useSetAtom(sheetAtom);
    const inset = useSafeAreaInsets();

    useEffect(() => {
        setSheet(sheetRef.current);
    }, [sheetRef.current]);

    return (<Sheet ref={sheetRef} snapPoints={['50%']}>
        <Comments />
    </Sheet>);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 250,
    },
});