import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { atom } from "jotai";
import { RefObject } from "react";

type PostTypeSelectorSheetRefAtomType = RefObject<BottomSheetModal> | null;

export const postTypeSelectorSheetRefAtom = atom<PostTypeSelectorSheetRefAtomType, [PostTypeSelectorSheetRefAtomType], null>(null, (get, set, value) =>
    set(postTypeSelectorSheetRefAtom, value)
);