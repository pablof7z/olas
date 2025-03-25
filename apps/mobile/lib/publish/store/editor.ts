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
import { FilterParameters } from '../filters/presets';
import { PublishBottomSheetRef } from '@/components/publish/PublishBottomSheet';
import { getRealPath } from 'react-native-compressor';

export interface MediaItem {
    id: string;
    uris: string[];
    type: 'image' | 'video';
    filter?: {
        id: string;
        parameters: FilterParameters;
    };
}

interface EditorState {
    selectedMedia: MediaItem[];
    selectedMediaIndex: number;
    isMultipleSelectionMode: boolean;
    caption: string;
    expiration: number | null;
    expirationRef: ExpirationBottomSheetRef | null;
    bottomSheetRef: PublishBottomSheetRef | null;
    state: string;
    error: string | null;
    isPublishing: boolean;
    addMedia: (mediaItem: MediaItem) => Promise<void>;
    removeMedia: (id: string) => void;
    clearMedia: () => void;
    updateMedia: (mediaId: string, updatedMedia: Partial<MediaItem>) => void;
    reorderMedia: (fromIndex: number, toIndex: number) => void;
    toggleSelectionMode: () => void;
    setMedia: (media: MediaItem) => Promise<void>;
    setCaption: (caption: string) => void;
    setExpiration: (expiration: number | null) => void;
    setState: (state: PostState) => void;
    publish: (ndk: NDK, blossomServer: string) => Promise<void>;
    reset: () => void;
    setSelectedMediaIndex: (index: number) => void;
    applyFilter: (mediaId: string, filterId: string, parameters: FilterParameters) => void;
    clearFilter: (mediaId: string) => void;
}

async function convertMediaPath(mediaItem: MediaItem): Promise<MediaItem> {
    const convertedUris = await Promise.all(
        mediaItem.uris.map(async (uri) => {
            const path = await getRealPath(uri, mediaItem.type);
            return path.startsWith('file://') ? path : `file://${path}`;
        })
    );
    return { ...mediaItem, uris: convertedUris };
}

export const useEditorStore = create<EditorState>((set, get) => ({
    selectedMedia: [],
    selectedMediaIndex: 0,
    isMultipleSelectionMode: false,
    caption: '',
    expiration: null,
    expirationRef: null,
    bottomSheetRef: null,
    state: 'idle',
    error: null,
    isPublishing: false,
    
    addMedia: async (mediaItem) => {
        const convertedMedia = await convertMediaPath(mediaItem);
        set((state) => ({
            selectedMedia: [...state.selectedMedia, convertedMedia]
        }));
    },
    
    setMedia: async (media) => {
        const convertedMedia = await convertMediaPath(media);
        set(() => ({
            selectedMedia: [convertedMedia]
        }));
    },
    
    removeMedia: (id) => set((state) => ({
        selectedMedia: state.selectedMedia.filter(item => item.id !== id)
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
        if (!PUBLISH_ENABLED) return;
        
        set({ isPublishing: true, error: null });
        
        try {
            const media = await prepareMedia(get().selectedMedia.map(item => item.uris[0]), (type, progress) => {
                set({ state: type + ' ' + (progress * 100).toFixed(0) + '%' });
            });
            
            set({ state: 'uploading' });
            let uploadedMedia: MediaItem[] = [];
            
            try {
                uploadedMedia = await uploadMedia(media, ndk, blossomServer);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                set({ state: 'error', error: errorMessage });
                return;
            }

            set({ state: 'uploaded' });

            const result = await generateEvent(ndk, { 
                caption: get().caption,
                expiration: get().expiration || undefined
            }, uploadedMedia);
            
            if (!result) {
                set({ state: 'error', error: 'Failed to generate event' });
                return;
            }
            
            const { event, relaySet } = result;
            await event.sign();
            set({ state: 'publishing' });

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
        state: 'idle',
        error: null,
        isPublishing: false
    }),

    setSelectedMediaIndex: (index) => set({
        selectedMediaIndex: index
    }),

    applyFilter: (mediaId, filterId, parameters) => {
        console.log('Editor Store - Applying filter:', {
            mediaId,
            filterId,
            parameters
        });
        set((state) => ({
            selectedMedia: state.selectedMedia.map(item => {
                if (item.id === mediaId) {
                    console.log('Found media item, applying filter:', {
                        itemId: item.id,
                        oldFilter: item.filter,
                        newFilter: { id: filterId, parameters }
                    });
                    return { ...item, filter: { id: filterId, parameters } };
                }
                return item;
            })
        }));
    },
    
    clearFilter: (mediaId) => {
        console.log('Editor Store - Clearing filter:', { mediaId });
        set((state) => ({
            selectedMedia: state.selectedMedia.map(item => 
                item.id === mediaId 
                    ? { ...item, filter: undefined } 
                    : item
            )
        }));
    }
}));

export const publishPostTypeAtom = atom<"post" | "story" | "video">("post");

export const captionBottomSheetRefAtom = atom<RefObject<BottomSheetModal> | null>(null);

export const expirationBottomSheetRefAtom = atom<RefObject<ExpirationBottomSheetRef> | null>(null);