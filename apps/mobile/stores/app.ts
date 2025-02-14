import { create } from "zustand";
import * as SecureStore from 'expo-secure-store';
import { ZapOption } from "@/app/(home)/(settings)/zaps";
import { db } from "./db";

export type VideosInFeed = 'none' | 'from-follows' | 'from-all';

export type SavedSearch = {
    title: string;
    subtitle: string;
    hashtags: string[];
    lastUsedAt: number;
}

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

    /**
     * Whether to show videos in the feed.
     */
    videosInFeed: VideosInFeed;

    /**
     * Force square-aspect ratio in feed.
     */
    forceSquareAspectRatio: boolean;

    /**
     * Saved searches.
     */
    savedSearches: SavedSearch[];
};

export type AppSettingsStoreActions = {
    init: () => void;
    setRemoveLocation: (removeLocation: boolean) => void;
    setBoost: (boost: boolean) => void;
    notificationsSeen: () => void;

    notificationsPrompted: () => void;
    toggleAdvancedMode: () => void;

    setDefaultZap: (zap: ZapOption) => void;

    setVideosInFeed: (videosInFeed: VideosInFeed) => void;

    setForceSquareAspectRatio: (forceSquareAspectRatio: boolean) => void;

    addSavedSearch: (search: SavedSearch) => void;
    removeSavedSearch: (title: string) => void;
    updateSavedSearch: (search: SavedSearch) => void;

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
    videosInFeed: 'from-follows',
    forceSquareAspectRatio: !(SecureStore.getItem('forceSquareAspectRatio') === 'false'),
    editingPosts: [],
    savedSearches: [],

    init: async () => {
        const state: Partial<AppSettingsStoreState> = {
            seenNotificationsAt: 0,
            promptedForNotifications: false,
            advancedMode: false,
            defaultZap: defaultZapSetting,
            videosInFeed: 'from-follows',
        };

        const removeLocation = SecureStore.getItem('removeLocation');
        if (removeLocation) state.removeLocation = removeLocation === 'true';

        const boost = SecureStore.getItem('boost');
        if (boost) state.boost = boost === 'true';

        const seenNotificationsAt = SecureStore.getItem('seenNotificationsAt');
        if (seenNotificationsAt) state.seenNotificationsAt = parseInt(seenNotificationsAt);

        const promptedForNotifications = SecureStore.getItem('promptedForNotifications');
        if (promptedForNotifications) state.promptedForNotifications = promptedForNotifications === 'true';

        const advancedMode = SecureStore.getItem('advancedMode');
        if (advancedMode) state.advancedMode = advancedMode === 'true';

        let defaultZapVal = SecureStore.getItem('defaultZap');
        if (defaultZapVal) {
            try { state.defaultZap = JSON.parse(defaultZapVal); } catch { }
        }
        state.defaultZap ??= defaultZapSetting;

        const videosInFeed = SecureStore.getItem('videosInFeed');
        if (videosInFeed) state.videosInFeed = videosInFeed as VideosInFeed;

        const savedSearches = db.getAllSync('SELECT * FROM saved_searches') as { title: string, subtitle: string, hashtags: string, last_used_at: number }[];
        state.savedSearches = savedSearches.map(search => ({
            title: search.title,
            subtitle: search.subtitle,
            hashtags: search.hashtags.split(' '),
            lastUsedAt: search.last_used_at
        })).sort((a, b) => b.lastUsedAt - a.lastUsedAt);

        set({ ...state });
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

    setVideosInFeed: (videosInFeed: VideosInFeed) => {
        SecureStore.setItemAsync('videosInFeed', videosInFeed);
        set({ videosInFeed });
    },

    setForceSquareAspectRatio: (forceSquareAspectRatio: boolean) => {
        SecureStore.setItemAsync('forceSquareAspectRatio', forceSquareAspectRatio.toString());
        console.log('setForceSquareAspectRatio', forceSquareAspectRatio);
        set({ forceSquareAspectRatio });
    },

    addSavedSearch: (search: SavedSearch) => {
        db.runSync('INSERT INTO saved_searches (title, subtitle, hashtags, last_used_at) VALUES (?, ?, ?, ?);', [search.title, search.subtitle, search.hashtags.join(' '), search.lastUsedAt]);
        set({ savedSearches: [...get().savedSearches, search] });
    },

    removeSavedSearch: (title: string) => {
        db.runSync('DELETE FROM saved_searches WHERE title = ?;', [title]);
        set({ savedSearches: get().savedSearches.filter(s => s.title !== title) });
    },

    updateSavedSearch: (search: SavedSearch) => {
        db.runSync('UPDATE saved_searches SET subtitle = ?, hashtags = ?, last_used_at = ? WHERE title = ?;', [search.subtitle, search.hashtags.join(' '), search.lastUsedAt, search.title]);
        set({ savedSearches: get().savedSearches.map(s => s.title === search.title ? search : s) });
    },

    reset: () => {
        SecureStore.deleteItemAsync('removeLocation');
        SecureStore.deleteItemAsync('boost');
        SecureStore.deleteItemAsync('seenNotificationsAt');
        SecureStore.deleteItemAsync('advancedMode');
        SecureStore.deleteItemAsync('videosInFeed');
        SecureStore.deleteItemAsync('defaultZap');
        SecureStore.deleteItemAsync('forceSquareAspectRatio');
        set({ seenNotificationsAt: 0, promptedForNotifications: false });
    }
}));
