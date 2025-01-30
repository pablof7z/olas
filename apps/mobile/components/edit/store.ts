import { create } from "zustand";
import { ImageEditCallback } from "./hook";

export type AppliedFilter = {
    name: string,
    amount?: number,
};

type ImageEditStore = {
    imageUri?: string;
    editedImageUri?: string;
    activeFilters: AppliedFilter[];
    cb?: ImageEditCallback;
}

type ImageEditStoreActions = {
    setImageUri: (imageUri: string) => void;
    setEditedImageUri: (editedImageUri: string) => void;
    setActiveFilters: (activeFilters: AppliedFilter[]) => void;
    addActiveFilter: (filter: AppliedFilter) => void;
    setCb: (cb: ImageEditCallback) => void;

    update: (newState: Partial<ImageEditStore>) => void;

    reset: () => void;
}

const initialState = {
    imageUri: undefined,
    editedImageUri: undefined,
    activeFilters: [],
    cb: undefined,
};

export const useEditImageStore = create<ImageEditStore & ImageEditStoreActions>((set) => ({
    ...initialState,

    setImageUri: (imageUri: string) => set({ imageUri }),
    setEditedImageUri: (editedImageUri: string) => set({ editedImageUri }),
    setActiveFilters: (activeFilters: AppliedFilter[]) => set({ activeFilters }),
    addActiveFilter: (filter: AppliedFilter) => set((state) => ({ activeFilters: [...state.activeFilters, filter] })),
    setCb: (cb: ImageEditCallback) => set({ cb }),

    update: (newState: Partial<ImageEditStore>) => set((state) => ({ ...state, ...newState })),

    reset: () => set(() => initialState)
}))
