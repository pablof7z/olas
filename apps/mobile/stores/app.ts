import { PostType } from "@/components/NewPost/store";
import { create } from "zustand";
import * as SecureStore from 'expo-secure-store';

export type AppSettingsStoreState = {
    removeLocation?: boolean;
    postType?: PostType;

    seenNotificationsAt: number;

    promptedForNotifications: boolean;
};

export type AppSettingsStoreActions = {
    init: () => void;
    setRemoveLocation: (removeLocation: boolean) => void;
    setPostType: (postType: PostType) => void;
    notificationsSeen: () => void;

    notificationsPrompted: () => void;

    reset: () => void;
};

export const useAppSettingsStore = create<AppSettingsStoreState & AppSettingsStoreActions>((set) => ({
    seenNotificationsAt: 0,
    promptedForNotifications: false,

    init: async () => {
        const state: AppSettingsStoreState = { seenNotificationsAt: 0, promptedForNotifications: false };

        const removeLocation = await SecureStore.getItemAsync('removeLocation');
        console.log('removeLocation', JSON.stringify(removeLocation));
        if (removeLocation) state.removeLocation = removeLocation === 'true';

        const postType = await SecureStore.getItemAsync('postType');
        if (postType) state.postType = postType as PostType;

        const seenNotificationsAt = await SecureStore.getItemAsync('seenNotificationsAt');
        if (seenNotificationsAt) state.seenNotificationsAt = parseInt(seenNotificationsAt);

        const promptedForNotifications = await SecureStore.getItemAsync('promptedForNotifications');
        if (promptedForNotifications) state.promptedForNotifications = promptedForNotifications === 'true';

        set(state);
    },

    setRemoveLocation: (removeLocation: boolean) => {
        SecureStore.setItemAsync('removeLocation', removeLocation.toString());
        set({ removeLocation });
    },

    setPostType: (postType: PostType) => {
        SecureStore.setItemAsync('postType', postType);
        set({ postType });
    },

    notificationsSeen: (time = Date.now() / 1000) => {
        SecureStore.setItemAsync('seenNotificationsAt', time.toString());
        set({ seenNotificationsAt: time });
    },

    notificationsPrompted: () => {
        SecureStore.setItemAsync('promptedForNotifications', 'true');
        set({ promptedForNotifications: true });
    },

    reset: () => {
        SecureStore.deleteItemAsync('removeLocation');
        SecureStore.deleteItemAsync('postType');
        SecureStore.deleteItemAsync('seenNotificationsAt');
        SecureStore.deleteItemAsync('promptedForNotifications');
        set({ seenNotificationsAt: 0, promptedForNotifications: false });
    }
}));
