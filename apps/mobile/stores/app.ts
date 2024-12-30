import { PostType } from "@/components/NewPost/store";
import { create } from "zustand";
import * as SecureStore from 'expo-secure-store';

export type AppSettingsStoreState = {
    removeLocation?: boolean;
    postType?: PostType;
};

export type AppSettingsStoreActions = {
    init: () => void;
    setRemoveLocation: (removeLocation: boolean) => void;
    setPostType: (postType: PostType) => void;
};

export const useAppSettingsStore = create<AppSettingsStoreState & AppSettingsStoreActions>((set) => ({
    init: async () => {
        const state: AppSettingsStoreState = {};

        const removeLocation = await SecureStore.getItemAsync('removeLocation');
        console.log('removeLocation', JSON.stringify(removeLocation));
        if (removeLocation) state.removeLocation = removeLocation === 'true';

        const postType = await SecureStore.getItemAsync('postType');
        if (postType) state.postType = postType as PostType;

        console.log('app settings', state);

        set(state);
    },

    setRemoveLocation: (removeLocation: boolean) => {
        console.log('setting setRemoveLocation', removeLocation.toString());
        SecureStore.setItemAsync('removeLocation', removeLocation.toString());
        set({ removeLocation });
    },

    setPostType: (postType: PostType) => {
        console.log('setting setPostType', postType);
        SecureStore.setItemAsync('postType', postType);
        set({ postType });
    },
}));