import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { ZapOption } from '@/app/(home)/(settings)/zaps';
import { db } from './db';
import { NDKCashuWallet, NDKNWCWallet, NDKWallet, NDKWalletTypes } from '@nostr-dev-kit/ndk-wallet';

export type VideosInFeed = 'none' | 'from-follows' | 'from-all';

export type SavedSearch = {
    title: string;
    subtitle: string;
    hashtags: string[];
    lastUsedAt: number;
};

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
     * Whether to enable YOLO zaps.
     */
    yoloZaps: boolean;

    /**
     * The growth factor for YOLO zaps.
     */
    yoloZapsGrowthFactor: number;

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

    walletType?: NDKWalletTypes | 'none';
    walletPayload?: string;
};

export type AppSettingsStoreActions = {
    init: () => void;
    setRemoveLocation: (removeLocation: boolean) => void;
    setBoost: (boost: boolean) => void;
    notificationsSeen: () => void;

    notificationsPrompted: () => void;
    toggleAdvancedMode: () => void;

    setDefaultZap: (zap: ZapOption) => void;
    setYoloZaps: (yoloZaps: boolean) => void;
    setYoloZapsGrowthFactor: (growthFactor: number) => void;

    setVideosInFeed: (videosInFeed: VideosInFeed) => void;

    setForceSquareAspectRatio: (forceSquareAspectRatio: boolean) => void;

    addSavedSearch: (search: SavedSearch) => void;
    removeSavedSearch: (title: string) => void;
    updateSavedSearch: (search: SavedSearch) => void;

    setWalletConfig: (wallet: NDKWallet) => void;
    unlinkWallet: () => void;

    reset: () => void;
};

const defaultZapSetting = {
    amount: 21,
    message: '😍😍😍😍',
};

function getWalletConfig(): {
    walletType?: NDKWalletTypes | 'none';
    walletPayload?: string | undefined;
} {
    const walletType = db.getFirstSync('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', ['wallet_type']) as { value: string };
    if (!walletType) return { walletType: undefined };
    if (walletType.value === 'none') return { walletType: 'none' };

    const walletPayload = db.getFirstSync('SELECT value FROM app_settings WHERE key = ? LIMIT 1;', ['wallet_payload']) as {
        value: string | undefined;
    };

    const mappedWalletType = walletType.value === 'nip60' ? 'nip-60' : walletType.value;

    return {
        walletType: mappedWalletType as NDKWalletTypes,
        walletPayload: walletPayload?.value,
    };
}

export const useAppSettingsStore = create<AppSettingsStoreState & AppSettingsStoreActions>((set, get) => ({
    seenNotificationsAt: 0,
    promptedForNotifications: false,
    advancedMode: false,
    defaultZap: defaultZapSetting,
    yoloZaps: true,
    yoloZapsGrowthFactor: 0.85,
    videosInFeed: 'from-follows',
    forceSquareAspectRatio: !(SecureStore.getItem('forceSquareAspectRatio') === 'false'),
    editingPosts: [],
    savedSearches: [],
    ...getWalletConfig(),

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
            try {
                state.defaultZap = JSON.parse(defaultZapVal);
            } catch {}
        }
        state.defaultZap ??= defaultZapSetting;

        const videosInFeed = SecureStore.getItem('videosInFeed');
        if (videosInFeed) state.videosInFeed = videosInFeed as VideosInFeed;

        const savedSearches = db.getAllSync('SELECT * FROM saved_searches') as {
            title: string;
            subtitle: string;
            hashtags: string;
            last_used_at: number;
        }[];
        state.savedSearches = savedSearches
            .map((search) => ({
                title: search.title,
                subtitle: search.subtitle,
                hashtags: search.hashtags.split(' '),
                lastUsedAt: search.last_used_at,
            }))
            .sort((a, b) => b.lastUsedAt - a.lastUsedAt);

        const appSettings = db.getAllSync('SELECT * FROM app_settings') as { key: string; value: string }[];
        appSettings.forEach((setting) => {
            switch (setting.key) {
                case 'yoloZaps':
                    state.yoloZaps = setting.value === 'true';
                    break;
                case 'yolo_zaps_growth_factor':
                    state.yoloZapsGrowthFactor = parseFloat(setting.value);
                    break;
            }
        });

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
        set((state) => {
            const value = !state.advancedMode;
            SecureStore.setItemAsync('advancedMode', (!!value).toString());
            return { advancedMode: value };
        });
    },

    setDefaultZap: (zap: ZapOption) => {
        SecureStore.setItemAsync('defaultZap', JSON.stringify(zap));
        set({ defaultZap: zap });
    },

    setYoloZaps: (yoloZaps: boolean) => {
        db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', ['yoloZaps', yoloZaps.toString()]);
        set({ yoloZaps });
    },

    setYoloZapsGrowthFactor: (growthFactor: number) => {
        db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', ['yolo_zaps_growth_factor', growthFactor.toString()]);
        set({ yoloZapsGrowthFactor: growthFactor });
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
        db.runSync('INSERT INTO saved_searches (title, subtitle, hashtags, last_used_at) VALUES (?, ?, ?, ?);', [
            search.title,
            search.subtitle,
            search.hashtags.join(' '),
            search.lastUsedAt,
        ]);
        set({ savedSearches: [...get().savedSearches, search] });
    },

    removeSavedSearch: (title: string) => {
        db.runSync('DELETE FROM saved_searches WHERE title = ?;', [title]);
        set({ savedSearches: get().savedSearches.filter((s) => s.title !== title) });
    },

    updateSavedSearch: (search: SavedSearch) => {
        db.runSync('UPDATE saved_searches SET subtitle = ?, hashtags = ?, last_used_at = ? WHERE title = ?;', [
            search.subtitle,
            search.hashtags.join(' '),
            search.lastUsedAt,
            search.title,
        ]);
        set({ savedSearches: get().savedSearches.map((s) => (s.title === search.title ? search : s)) });
    },

    setWalletConfig: (wallet: NDKWallet) => {
        let payload: string | undefined;

        if (wallet instanceof NDKCashuWallet) {
            db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', ['wallet_type', 'nip60']);
            db.runSync('DELETE FROM app_settings WHERE key = ?;', ['wallet_payload']);
        } else if (wallet instanceof NDKNWCWallet) {
            payload = wallet.pairingCode;
            db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', ['wallet_type', 'nwc']);
            db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', ['wallet_payload', payload]);
        }
        set({ walletType: wallet.type, walletPayload: payload });
    },

    unlinkWallet: () => {
        db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?);', ['wallet_type', 'none']);
        db.runSync('DELETE FROM app_settings WHERE key = ?;', ['wallet_payload']);
        SecureStore.setItemAsync('wallet', 'none');
        SecureStore.deleteItemAsync('wallet_last_updated_at');
        set({ walletType: 'none' });
    },

    reset: () => {
        SecureStore.deleteItemAsync('removeLocation');
        SecureStore.deleteItemAsync('boost');
        SecureStore.deleteItemAsync('seenNotificationsAt');
        SecureStore.deleteItemAsync('advancedMode');
        SecureStore.deleteItemAsync('videosInFeed');
        SecureStore.deleteItemAsync('defaultZap');
        SecureStore.deleteItemAsync('forceSquareAspectRatio');
        SecureStore.deleteItemAsync('wallet');
        SecureStore.deleteItemAsync('wallet_last_updated_at');

        db.runSync('DELETE FROM app_settings;');

        set({
            seenNotificationsAt: 0,
            promptedForNotifications: false,
            walletType: undefined,
            walletPayload: undefined,
        });
    },
}));
