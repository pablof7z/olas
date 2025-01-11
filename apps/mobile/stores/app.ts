import { PostType } from "@/components/NewPost/store";
import { create } from "zustand";
import * as SecureStore from 'expo-secure-store';

export type AppSettingsStoreState = {
    removeLocation?: boolean;
    postType?: PostType;

    seenNotificationsAt: number;

    promptedForNotifications: boolean;

    /**
     * Whether to show advanced settings.
     */
    advancedMode: boolean;
};

export type AppSettingsStoreActions = {
    init: () => void;
    setRemoveLocation: (removeLocation: boolean) => void;
    setPostType: (postType: PostType) => void;
    notificationsSeen: () => void;

    notificationsPrompted: () => void;
    toggleAdvancedMode: () => void;

    reset: () => void;
};

export const useAppSettingsStore = create<AppSettingsStoreState & AppSettingsStoreActions>((set, get) => ({
    seenNotificationsAt: 0,
    promptedForNotifications: false,
    advancedMode: false,

    init: async () => {
        const state: AppSettingsStoreState = {
            seenNotificationsAt: 0,
            promptedForNotifications: false,
            advancedMode: false
        };

        const removeLocation = await SecureStore.getItemAsync('removeLocation');
        if (removeLocation) state.removeLocation = removeLocation === 'true';

        const postType = await SecureStore.getItemAsync('postType');
        if (postType) state.postType = postType as PostType;

        const seenNotificationsAt = await SecureStore.getItemAsync('seenNotificationsAt');
        if (seenNotificationsAt) state.seenNotificationsAt = parseInt(seenNotificationsAt);

        const promptedForNotifications = await SecureStore.getItemAsync('promptedForNotifications');
        if (promptedForNotifications) state.promptedForNotifications = promptedForNotifications === 'true';

        const advancedMode = await SecureStore.getItemAsync('advancedMode');
        if (advancedMode) state.advancedMode = advancedMode === 'true';

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

    toggleAdvancedMode: () => {
        set(state => {
            const value = !state.advancedMode;
            SecureStore.setItemAsync('advancedMode', (!!value).toString());
            return { advancedMode: value };
        })
    },

    reset: () => {
        SecureStore.deleteItemAsync('removeLocation');
        SecureStore.deleteItemAsync('postType');
        SecureStore.deleteItemAsync('seenNotificationsAt');
        SecureStore.deleteItemAsync('advancedMode');
        set({ seenNotificationsAt: 0, promptedForNotifications: false });
    }
}));
