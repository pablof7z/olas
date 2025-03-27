import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom } from 'jotai';
import { RefObject } from 'react';
import { create } from 'zustand';

type FeedEditorBottomSheetRefAtomType = RefObject<BottomSheetModal> | null;
export const feedEditorBottomSheetRefAtom = atom<FeedEditorBottomSheetRefAtomType, [FeedEditorBottomSheetRefAtomType], null>(
    null,
    (get, set, value) => set(feedEditorBottomSheetRefAtom, value)
);

interface FeedEditorProps {
    title: string;
    description: string;
    image: string;
    hashtags: string[];
    pubkeys: string[];
    encrypted: boolean;

    mode: 'confirm' | 'edit' | 'add-to-existing';
}

interface FeedEditorActions {
    setTitle: (title: string) => void;
    setDescription: (description: string) => void;
    setImage: (image: string) => void;
    setHashtags: (hashtags: string[]) => void;
    setPubkeys: (pubkeys: string[]) => void;
    setEncrypted: (encrypted: boolean) => void;
    setMode: (mode: 'confirm' | 'edit' | 'add-to-existing') => void;
    save: () => void;

    setSaveHashtagMode: (hashtag: string) => void;
}
export const useFeedEditorStore = create<FeedEditorProps & FeedEditorActions>((set) => ({
    title: '',
    description: '',
    image: '',
    hashtags: [],
    pubkeys: [],
    encrypted: false,
    mode: 'confirm',

    setTitle: (title: string) => set({ title }),
    setDescription: (description: string) => set({ description }),
    setImage: (image: string) => set({ image }),
    setHashtags: (hashtags: string[]) => set({ hashtags }),
    setPubkeys: (pubkeys: string[]) => set({ pubkeys }),
    setEncrypted: (encrypted: boolean) => set({ encrypted }),
    setMode: (mode) => set({ mode }),

    save: () => {
        console.log('save');
    },

    setSaveHashtagMode: (hashtag: string) => {
        set({
            mode: 'confirm',
            title: hashtag,
            description: hashtag,
            image: '',
            hashtags: [hashtag],
        });
    },
}));
