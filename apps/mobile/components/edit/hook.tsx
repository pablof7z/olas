import { router } from "expo-router";
import { create } from "zustand";
import { useCallback, useEffect } from "react";
import { useEditImageStore } from "./store";

export type ImageEditCallback = (uri: string) => void;
export type UseImageEditProps = {
    cb?: ImageEditCallback;
}

export default function useEditImage() {
    const store = useEditImageStore();
    
    const editImage = useCallback((
        imageUri: string,
        cb?: ImageEditCallback
    ) => {
        if (!imageUri) return;
        store.update({ imageUri, cb });
    }, [  ]);

    return { editImage }
}