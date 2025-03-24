import { create } from 'zustand';
import { PostMedia, PostState, PostMetadata } from '@/lib/post-editor/types';
import { atom } from 'jotai';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { RefObject } from 'react';
import NDK, { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { prepareMedia } from '@/lib/post-editor/actions/prepare';
import { uploadMedia } from '@/lib/post-editor/actions/upload';
import { generateEvent } from '@/lib/post-editor/event';
import { PUBLISH_ENABLED } from '@/utils/const';
import { ExpirationBottomSheetRef } from "@/lib/publish/components/composer/metadata/ExpirationBottomSheet";

interface EditorState {
    selectedMedia: PostMedia[];
    isMultipleSelectionMode: boolean;
    caption: string;
    expiration: number | null;
    state: PostState;
    error: string | null;
    isPublishing: boolean;
    addMedia: (media: PostMedia) => void;
    removeMedia: (mediaId: string) => void;
    clearMedia: () => void;
    updateMedia: (mediaId: string, updatedMedia: Partial<PostMedia>) => void;
    reorderMedia: (fromIndex: number, toIndex: number) => void;
    toggleSelectionMode: () => void;
    setMedia: (media: PostMedia) => void;
    setCaption: (caption: string) => void;
    setExpiration: (expiration: number | null) => void;
    setState: (state: PostState) => void;
    publish: (ndk: NDK, blossomServer: string) => Promise<void>;
    reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    selectedMedia: [],
    isMultipleSelectionMode: false,
    caption: '',
    expiration: null,
    state: 'editing',
    error: null,
    isPublishing: false,
    
    addMedia: (media) => set((state) => {
        if (!state.isMultipleSelectionMode) {
            return { selectedMedia: [media] };
        }
        return { selectedMedia: [...state.selectedMedia, media] };
    }),
    
    setMedia: (media) => set(() => ({
        selectedMedia: [media]
    })),
    
    removeMedia: (mediaId) => set((state) => ({
        selectedMedia: state.selectedMedia.filter(item => item.id !== mediaId)
    })),
    
    clearMedia: () => set({ selectedMedia: [] }),
    
    updateMedia: (mediaId, updatedMedia) => set((state) => ({
        selectedMedia: state.selectedMedia.map(item => 
            item.id === mediaId ? { ...item, ...updatedMedia } : item
        )
    })),
    
    reorderMedia: (fromIndex, toIndex) => set((state) => {
        const newMedia = [...state.selectedMedia];
        const [movedItem] = newMedia.splice(fromIndex, 1);
        newMedia.splice(toIndex, 0, movedItem);
        return { selectedMedia: newMedia };
    }),

    toggleSelectionMode: () => set((state) => ({
        isMultipleSelectionMode: !state.isMultipleSelectionMode,
        selectedMedia: [] // Clear selection when toggling modes
    })),
    
    setCaption: (caption) => set({ caption }),
    
    setExpiration: (expiration) => set({ expiration }),

    setState: (state) => set({ state }),

    publish: async (ndk: NDK, blossomServer: string) => {
        set({ isPublishing: true, state: 'Preparing' });
        
        // Create PostMetadata from caption and expiration
        const metadata: PostMetadata = { 
            caption: get().caption,
            expiration: get().expiration || undefined
        };

        try {
            const media = await prepareMedia(get().selectedMedia, (type, progress) => {
                set({ state: type + ' ' + (progress * 100).toFixed(0) + '%' });
            });
            
            set({ state: 'uploading' });
            let uploadedMedia: PostMedia[] = [];
            
            try {
                uploadedMedia = await uploadMedia(media, ndk, blossomServer);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                set({ state: 'error', error: errorMessage });
                return;
            }

            set({ state: 'uploaded' });

            const result = await generateEvent(ndk, metadata, uploadedMedia);
            
            if (!result) {
                set({ state: 'error', error: 'Failed to generate event' });
                return;
            }
            
            const { event, relaySet } = result;
            await event.sign();
            set({ state: 'publishing' });

            if (!PUBLISH_ENABLED) {
                alert('Publish disabled in dev mode');
                set({ isPublishing: false, selectedMedia: [], state: 'editing', caption: '', expiration: null });
                return;
            }

            await event.publish(relaySet);
            
            // Reset state after successful publish
            set({ 
                isPublishing: false, 
                selectedMedia: [], 
                state: 'editing', 
                caption: '',
                expiration: null,
                error: null 
            });
            
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            set({ state: 'error', error: errorMessage, isPublishing: false });
        }
    },

    reset: () => set({
        selectedMedia: [],
        isMultipleSelectionMode: false,
        caption: '',
        expiration: null,
        state: 'editing',
        error: null,
        isPublishing: false
    })
}));

export const publishPostTypeAtom = atom<"post" | "story" | "video">("post");

export const captionBottomSheetRefAtom = atom<RefObject<BottomSheetModal> | null>(null);

export const expirationBottomSheetRefAtom = atom<RefObject<ExpirationBottomSheetRef> | null>(null);