import { create } from "zustand";
import * as SecureStore from 'expo-secure-store';
import { ZapOption } from "@/app/(tabs)/(settings)/zaps";

export type AppSettingsStoreState = {
    removeLocation?: boolean;
    boost?: boolean;

    seenNotificationsAt: number;

    promptedForNotifications: boolean;

    /**
     * Whether to show advanced settings.
     */
    advancedMode: boolean;

    /**
     * The default zap to use when sending a zap.
     */
    defaultZap: ZapOption;
};

export type AppSettingsStoreActions = {
    init: () => void;
    setRemoveLocation: (removeLocation: boolean) => void;
    setBoost: (boost: boolean) => void;
    notificationsSeen: () => void;

    notificationsPrompted: () => void;
    toggleAdvancedMode: () => void;

    setDefaultZap: (zap: ZapOption) => void;

    reset: () => void;
};

const defaultZapSetting = {
    amount: 21,
    message: '😍😍😍😍'
}

export const useAppSettingsStore = create<AppSettingsStoreState & AppSettingsStoreActions>((set, get) => ({
    seenNotificationsAt: 0,
    promptedForNotifications: false,
    advancedMode: false,
    defaultZap: defaultZapSetting,

    init: async () => {
        const state: AppSettingsStoreState = {
            seenNotificationsAt: 0,
            promptedForNotifications: false,
            advancedMode: false,
            defaultZap: defaultZapSetting,
        };

        const removeLocation = await SecureStore.getItemAsync('removeLocation');
        if (removeLocation) state.removeLocation = removeLocation === 'true';

        const boost = await SecureStore.getItemAsync('boost');
        if (boost) state.boost = boost;

        const seenNotificationsAt = await SecureStore.getItemAsync('seenNotificationsAt');
        if (seenNotificationsAt) state.seenNotificationsAt = parseInt(seenNotificationsAt);

        const promptedForNotifications = await SecureStore.getItemAsync('promptedForNotifications');
        if (promptedForNotifications) state.promptedForNotifications = promptedForNotifications === 'true';

        const advancedMode = await SecureStore.getItemAsync('advancedMode');
        if (advancedMode) state.advancedMode = advancedMode === 'true';

        let defaultZapVal = await SecureStore.getItemAsync('defaultZap');
        if (defaultZapVal) {
            try { state.defaultZap = JSON.parse(defaultZapVal); } catch { }
        }
        state.defaultZap ??= defaultZapSetting;

        set(state);
    },

    setRemoveLocation: (removeLocation: boolean) => {
        SecureStore.setItemAsync('removeLocation', removeLocation.toString());
        set({ removeLocation });
    },

    setBoost: (boost: boolean) => {
        SecureStore.setItemAsync('boost', boost.toString());
        set({ boost });
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

    setDefaultZap: (zap: ZapOption) => {
        SecureStore.setItemAsync('defaultZap', JSON.stringify(zap));
        set({ defaultZap: zap });
    },

    reset: () => {
        SecureStore.deleteItemAsync('removeLocation');
        SecureStore.deleteItemAsync('boost');
        SecureStore.deleteItemAsync('seenNotificationsAt');
        SecureStore.deleteItemAsync('advancedMode');
        SecureStore.deleteItemAsync('defaultZap');
        set({ seenNotificationsAt: 0, promptedForNotifications: false });
    }
}));
