import { useAtom } from "jotai";
import { userBottomSheetAtom } from "./store";

export function useUserBottomSheet() {
    const [user, setUser] = useAtom(userBottomSheetAtom);

    return { user, setUser };
}
