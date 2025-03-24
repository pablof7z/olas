import { create } from 'zustand';
import { Dimensions } from 'react-native';
import { NDKUser, NDKUserProfile, NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { atom } from 'jotai';
import { getNextStyleName as getNextTextStyleName } from '../components/sticker-types/text/styles';
import { getNextStyleName as getNextMentionStyleName } from '../components/sticker-types/mention/styles';
import { getNextStyleName as getNextCountdownStyle } from '../components/sticker-types/countdown/styles';
import { getNextStyleName as getNextEventStyleName } from '../components/sticker-types/event/styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Type mapping for sticker value types
type StickerValueType<T extends NDKStoryStickerType> = 
    T extends NDKStoryStickerType.Pubkey ? NDKUser :
    T extends NDKStoryStickerType.Text ? string :
    T extends NDKStoryStickerType.Countdown ? string :
    T extends NDKStoryStickerType.Event ? NDKEvent :
    string | NDKUser;

export interface Sticker<T extends NDKStoryStickerType = NDKStoryStickerType> {
    id: string;
    type: T;
    value: StickerValueType<T>;
    style?: string;
    transform: {
        translateX: number;
        translateY: number;
        scale: number;
        rotate: number;
    };
    dimensions?: {
        width: number;
        height: number;
    };
    metadata?: {
        profile?: NDKUserProfile;
        event?: NDKEvent;
        endTime?: Date;
        title?: string;
    };
}

interface StickerState {
    stickers: Sticker[];
    duration: number; // Duration in seconds before story expires
    addSticker: (sticker: Omit<Sticker, 'id' | 'transform'> & { transform?: Partial<Sticker['transform']> }) => string;
    updateSticker: (id: string, transform: Sticker['transform']) => void;
    updateStickerStyle: (id: string, style: string) => void;
    updateStickerValue: <T extends NDKStoryStickerType>(id: string, value: StickerValueType<T>) => void;
    updateStickerDimensions: (id: string, dimensions: { width: number; height: number }) => void;
    removeSticker: (id: string) => void;
    getSticker: (id: string) => Sticker | undefined;
    nextStyle: (id: string) => void;
    getDuration: () => number;
    updateDuration: (seconds: number) => void;
    reset: () => void;
}

export const useStickerStore = create<StickerState>((set, get) => ({
    stickers: [],
    duration: 24 * 60 * 60, // Default: 24 hours in seconds

    addSticker: (stickerData) => {
        console.log('In useStickerStore.addSticker with data:', stickerData);
        const id = Math.random().toString();
        const defaultTransform = {
            translateX: SCREEN_WIDTH / 4,
            translateY: SCREEN_HEIGHT / 4,
            scale: 1,
            rotate: 0,
        };

        const newSticker: Sticker = {
            id,
            type: stickerData.type,
            value: stickerData.value,
            style: stickerData.style || getNextTextStyleName(),
            dimensions: stickerData.dimensions,
            transform: {
                ...defaultTransform,
                ...stickerData.transform,
            },
            metadata: stickerData.metadata,
        };

        set((state) => {
            const newState = { stickers: [...state.stickers, newSticker] };
            return newState;
        });
        return id;
    },

    updateSticker: (id: string, transform: Sticker['transform']) => {
        set((state) => ({
            stickers: state.stickers.map((sticker) => (sticker.id === id ? { ...sticker, transform } : sticker)),
        }));
    },

    updateStickerStyle: (id: string, style: string) => {
        set((state) => ({
            stickers: state.stickers.map((sticker) => (sticker.id === id ? { ...sticker, style } : sticker)),
        }));
    },

    updateStickerValue: <T extends NDKStoryStickerType>(id: string, value: StickerValueType<T>) => {
        set((state) => ({
            stickers: state.stickers.map((sticker) => (sticker.id === id ? { ...sticker, value } : sticker)),
        }));
    },

    updateStickerDimensions: (id: string, dimensions: { width: number; height: number }) => {
        console.log('In useStickerStore.updateStickerDimensions with id:', id, 'and dimensions:', dimensions);
        set((state) => ({
            stickers: state.stickers.map((sticker) => (sticker.id === id ? { ...sticker, dimensions } : sticker)),
        }));
    },

    removeSticker: (id: string) => {
        set((state) => ({
            stickers: state.stickers.filter((sticker) => sticker.id !== id),
        }));
    },

    getSticker: (id: string) => {
        return get().stickers.find((sticker) => sticker.id === id);
    },

    nextStyle: (id: string) => {
        set((state) => {
            const stickers = state.stickers;
            const stickerIndex = stickers.findIndex((sticker) => sticker.id === id);
            if (stickerIndex === -1) return { stickers };

            const sticker = stickers[stickerIndex];
            const nextStyle = getNextStyleId(sticker.type, sticker.style);
            stickers[stickerIndex] = { ...sticker, style: nextStyle };

            return { stickers };
        });
    },

    getDuration: () => {
        return get().duration;
    },

    updateDuration: (seconds: number) => {
        set({ duration: seconds });
    },

    reset: () => {
        set({ 
            stickers: [],
            duration: 24 * 60 * 60 // Reset to default duration
        });
    }
}));

/**
 * Jotai atom for the sticker being edited
 */
export const editStickerAtom = atom<Sticker<NDKStoryStickerType> | null>(null);

function getNextStyleId(type: NDKStoryStickerType, style?: string): string {
    switch (type) {
        case NDKStoryStickerType.Text:
            return getNextTextStyleName(style);
        case NDKStoryStickerType.Pubkey:
            return getNextMentionStyleName(style);
        case NDKStoryStickerType.Countdown:
            return getNextCountdownStyle(style);
        case NDKStoryStickerType.Event:
            return getNextEventStyleName(style);
        default:
            return '';
    }
}
