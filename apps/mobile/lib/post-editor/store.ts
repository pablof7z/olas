import { create } from 'zustand';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { RefObject } from 'react';
import { PostMedia, PostMetadata, PostState, PostMediaType } from './types';
import { atom } from 'jotai';
import * as ImagePicker from 'expo-image-picker';
import { prepareMedia } from './actions/prepare';
import { uploadMedia } from './actions/upload';
import NDK, { NDKEvent, NDKKind, NDKRelaySet } from '@nostr-dev-kit/ndk-mobile';
import { mapImagePickerAssetToPostMedia, postTypeToImagePickerType } from '@/utils/media';
import { generateEvent } from './event';


interface PostEditorStoreState {
    // internal random id
    id: string;
    
    state: PostState;
    media: PostMedia[];
    metadata: PostMetadata;

    readyToPublish: boolean;    

    error: string | null;

    // whether we are showing a selector for media
    selecting: boolean;

    // whether we are editing an index
    editingIndex: number | null;
}

interface PostEditorStoreActions {
    setState: (state: PostState) => void;
    setMedia: (media: PostMedia[]) => void;
    setMetadata: (metadata: PostMetadata) => void;
    setReadyToPublish: (ready: boolean) => void;
    addMedia: (media: PostMedia) => void;

    setEditingIndex: (index: number | null) => void;

    newMediaFromSelector: (types?: PostMediaType[]) => void;
    openPickerIfEmpty: () => void;

    publish: (ndk: NDK, blossomServer: string) => Promise<void>;

    reset: () => void;
}

export type PostEditorStore = PostEditorStoreState & PostEditorStoreActions;

export const usePostEditorStore = create<PostEditorStore>((set, get) => ({
    id: getRandomId(),
    state: "editing",
    media: [],
    metadata: { caption: '' },
    readyToPublish: false,
    error: null,
    selecting: false,
    editingIndex: null,
    setState: (state) => set({ state: state }),
    setMedia: (media) => set({ media: media }),
    setMetadata: (metadata) => set({ metadata: metadata }),
    setReadyToPublish: (ready) => set({ readyToPublish: ready }),
    addMedia: (media) => set((state) => ({ media: [...state.media, media] })),

    newMediaFromSelector: (types: PostMediaType[] = ['image', 'video']) => {
        set({ selecting: true });
        ImagePicker.launchImageLibraryAsync({
            mediaTypes: types.map(postTypeToImagePickerType),
            allowsMultipleSelection: false,
            exif: true,
        }).then((result) => {
            const selectedAsset = result.assets?.[0];
            
            if (selectedAsset?.type === 'video') {
                mapImagePickerAssetToPostMedia(selectedAsset).then((item) => {
                    set({ media: [...get().media, item] });
                });
            } else if (selectedAsset?.type === 'image') {
                mapImagePickerAssetToPostMedia(selectedAsset).then((item) => {
                    const currentMedia = get().media;
                    set({ media: [...currentMedia, item], editingIndex: currentMedia.length });
                });
            }
        })
        .finally(() => {
            set({ selecting: false });
        });
    },

    openPickerIfEmpty: () => {
        const { media, newMediaFromSelector } = get();
        if (media.length === 0) {
            newMediaFromSelector();
        }
    },

    setEditingIndex: (index) => {
        set({ editingIndex: index })
    },

    publish: async (ndk: NDK, blossomServer: string) => {
        set({ readyToPublish: true });
        set({ state: 'uploading' });
        const media = await prepareMedia(get().media);
        const uploadedMedia = await uploadMedia(media, ndk, blossomServer);

        set({ state: 'uploaded' });
        
        // setSelectedMedia(uploadedMedia);
        const { metadata } = get();



        let { event, relaySet } = await generateEvent(ndk, metadata, uploadedMedia);
        await event.sign();
        set({ state: 'publishing' });

        event.publish(relaySet).then(async () => {
            if (metadata.boost) {
                const boost = new NDKEvent(ndk);
                boost.kind = NDKKind.Text;
                boost.content = "nostr:" + event.encode();
                boost.tag(event, "mention", false, "q");
                await boost.publish();
            }

            set({ readyToPublish: false, media: [], state: 'editing', metadata: { caption: '' } });
        }).catch((error) => {
            set({ error: error.message });
        });
    },

    reset: () => set({
        state: "editing",
        media: [],
        metadata: { caption: '' },
        readyToPublish: false,
        error: null,
    })
}))



/**
 * Bottom sheet refs
 */
export const postTypeSelectorSheetRefAtom = atom<RefObject<BottomSheetModal> | null, [RefObject<BottomSheetModal> | null], null>(null, (get, set, value) =>
    set(postTypeSelectorSheetRefAtom, value)
);

export const locationBottomSheetRefAtom = atom<RefObject<BottomSheetModal> | null, [RefObject<BottomSheetModal> | null], null>(null, (get, set, value) =>
    set(locationBottomSheetRefAtom, value)
);

export const communityBottomSheetRefAtom = atom<RefObject<BottomSheetModal> | null, [RefObject<BottomSheetModal> | null], null>(null, (get, set, value) =>
    set(communityBottomSheetRefAtom, value)
);

function getRandomId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

