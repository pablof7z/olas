import NDK from '@nostr-dev-kit/ndk-mobile';
import { atom } from 'jotai';
import { create } from 'zustand';

import { generateEvent } from '@/lib/publish/actions/event';
import { uploadMedia } from '@/lib/publish/actions/upload';
import { PostMedia, PostMetadata, PostState, Location } from '@/lib/publish/types';
import { PUBLISH_ENABLED } from '@/utils/const';
import { convertMediaPath, extractLocationFromMedia } from '@/utils/media';
import { prepareMedia } from '@/utils/media/prepare';

interface EditorState {
    /** Array of media items (images/videos) to be published */
    media: PostMedia[];

    /** Flag to determine if multiple media items can be selected at once */
    isMultipleSelectionMode: boolean;

    /** Text caption for the post */
    caption: string;

    /** Post expiration time in seconds, null means no expiration */
    expiration: number | null;

    /** Geographic location associated with the post */
    location: Location | null;

    /** Whether to include location data in published post */
    includeLocation: boolean;

    /** Current state of the publishing process (editing, uploading, etc.) */
    state: string;

    /** Error message if publishing fails, null otherwise */
    error: string | null;

    /** Flag to indicate whether a publish operation is in progress */
    isPublishing: boolean;

    /** Add a new media item to the post */
    addMedia: (uri: string, mediaType: 'image' | 'video', id?: string) => Promise<void>;

    /** Remove a media item from the post by its id */
    removeMedia: (id: string) => void;

    /** Remove all media items from the post */
    clearMedia: () => void;

    /** Update properties of a specific media item */
    updateMedia: (mediaId: string, updatedMedia: Partial<PostMedia>) => void;

    /** Reorder media items in the collection */
    reorderMedia: (fromIndex: number, toIndex: number) => void;

    /** Toggle between single and multiple selection modes */
    toggleSelectionMode: () => void;

    /** Set the post caption text */
    setCaption: (caption: string) => void;

    /** Set the post expiration time */
    setExpiration: (expiration: number | null) => void;

    /** Set the geographic location associated with the post */
    setLocation: (location: Location | null) => void;

    /** Control whether location data should be included in the published post */
    setIncludeLocation: (include: boolean) => void;

    /** Update the current state of the publishing process */
    setState: (state: PostState) => void;

    /** Publish the post */
    publish: (ndk: NDK, blossomServer: string) => Promise<void>;

    /** Reset all editor state to default values */
    reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    media: [],
    isMultipleSelectionMode: false,
    caption: '',
    expiration: null,
    location: null,
    includeLocation: true,
    state: 'idle',
    error: null,
    isPublishing: false,

    addMedia: async (uri, mediaType) => {
        const convertedUri = await convertMediaPath(uri, mediaType);
        const id = convertedUri;

        set((state) => {
            const newPostMedia: PostMedia = {
                id,
                mediaType,
                uris: [convertedUri],
                contentMode: 'portrait', // Default value, should be updated later
            };

            if (state.isMultipleSelectionMode) {
                // Check if the media item is already selected
                const mediaExists = state.media.some((item) => item.id === id);

                if (mediaExists) {
                    // If the item exists, remove it (toggle off)
                    return {
                        media: state.media.filter((item) => item.id !== id),
                    };
                } else {
                    // If the item doesn't exist, add it (toggle on)
                    return {
                        media: [...state.media, newPostMedia],
                    };
                }
            } else {
                // In single selection mode, just replace the selection
                return { media: [newPostMedia] };
            }
        });

        // Extract location from EXIF data if available and no location is set yet
        if (mediaType === 'image') {
            const location = await extractLocationFromMedia(uri);
            if (location) {
                set({ location });
            }
        }
    },

    removeMedia: (id) =>
        set((state) => ({
            media: state.media.filter((item) => item.id !== id),
        })),

    clearMedia: () => set({ media: [] }),

    updateMedia: (mediaId, updatedMedia) =>
        set((state) => ({
            media: state.media.map((item) => (item.id === mediaId ? { ...item, ...updatedMedia } : item)),
        })),

    reorderMedia: (fromIndex, toIndex) =>
        set((state) => {
            const newMedia = [...state.media];
            const [movedItem] = newMedia.splice(fromIndex, 1);
            newMedia.splice(toIndex, 0, movedItem);
            return { media: newMedia };
        }),

    toggleSelectionMode: () =>
        set((state) => ({
            isMultipleSelectionMode: !state.isMultipleSelectionMode,
            media: state.isMultipleSelectionMode ? state.media : [state.media[0]],
        })),

    setCaption: (caption) => set({ caption }),

    setExpiration: (expiration) => set({ expiration }),

    setLocation: (location) => set({ location }),

    setIncludeLocation: (include) => set({ includeLocation: include }),

    setState: (state) => set({ state }),

    publish: async (ndk: NDK, blossomServer: string) => {
        set({ isPublishing: true, error: null });

        try {
            const media = await prepareMedia(get().media, (type, progress) => {
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

            const { location, includeLocation, caption, expiration } = get();
            const metadata: PostMetadata = { caption, expiration: expiration || undefined };

            // Add location data to metadata if it exists and should be included
            if (location && includeLocation) {
                metadata.location = location;
            }

            const result = await generateEvent(ndk, metadata, uploadedMedia);

            if (!result) {
                set({ state: 'error', error: 'Failed to generate event' });
                return;
            }

            const { event, relaySet } = result;
            await event.sign();
            set({ state: 'publishing' });

            if (PUBLISH_ENABLED) {
                await event.publish(relaySet);
            }

            // Reset state after successful publish
            set({
                isPublishing: false,
                media: [],
                state: 'editing',
                caption: '',
                expiration: null,
                location: null,
                includeLocation: true,
                error: null,
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            set({ state: 'error', error: errorMessage, isPublishing: false });
        }
    },

    reset: () =>
        set({
            media: [],
            isMultipleSelectionMode: false,
            caption: '',
            expiration: null,
            location: null,
            includeLocation: true,
            state: 'idle',
            error: null,
            isPublishing: false,
        }),
}));

/** Atom that controls what type of content is being published (post, story, or video) */
export const publishPostTypeAtom = atom<'post' | 'story' | 'video'>('post');
