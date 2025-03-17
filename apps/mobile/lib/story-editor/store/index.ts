import { create } from 'zustand';
import { Dimensions } from 'react-native';
import { NDKUser, NDKUserProfile, NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';
import { UserProfile } from '@/hooks/user-profile';
import { atom } from 'jotai';
import { getNextStyleName as getNextTextStyleName } from '../components/sticker-types/text/styles';
import { getNextStyleName as getNextMentionStyleName } from '../components/sticker-types/mention/styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface Sticker {
    id: string;
    type: NDKStoryStickerType;
    value: string;
    style?: string;
    transform: {
        translateX: number;
        translateY: number;
        scale: number;
        rotate: number;
    };
    metadata?: {
        profile?: UserProfile;
        event?: NDKEvent;
        endTime?: Date;
        title?: string;
    };
}

interface StickerState {
    stickers: Sticker[];
    addSticker: (sticker: Omit<Sticker, 'id' | 'transform'> & { transform?: Partial<Sticker['transform']> }) => string;
    updateSticker: (id: string, transform: Sticker['transform']) => void;
    updateStickerStyle: (id: string, style: string) => void;
    updateStickerValue: (id: string, content: string) => void;
    removeSticker: (id: string) => void;
    getSticker: (id: string) => Sticker | undefined;
    nextStyle: (id: string) => void;
}

export const useStickerStore = create<StickerState>((set, get) => ({
    stickers: [],
    
    addSticker: (stickerData) => {
        console.log('In useStickerStore.addSticker with data:', stickerData);
        const id = Math.random().toString();
        const defaultTransform = {
            translateX: SCREEN_WIDTH / 2 - 50,
            translateY: SCREEN_HEIGHT / 2 - 50,
            scale: 1,
            rotate: 0,
        };

        const newSticker: Sticker = {
            id,
            type: stickerData.type,
            value: stickerData.value,
            style: stickerData.style,
            transform: {
                ...defaultTransform,
                ...stickerData.transform
            },
            metadata: stickerData.metadata,
        };
        
        console.log('Creating new sticker:', newSticker);
        set((state) => {
            const newState = { stickers: [...state.stickers, newSticker] };
            console.log('New stickers state:', newState.stickers);
            return newState;
        });
        return id;
    },

    updateSticker: (id: string, transform: Sticker['transform']) => {
        set((state) => ({
            stickers: state.stickers.map(sticker =>
                sticker.id === id ? { ...sticker, transform } : sticker
            )
        }));
    },

    updateStickerStyle: (id: string, style: string) => {
        set((state) => ({
            stickers: state.stickers.map(sticker =>
                sticker.id === id ? { ...sticker, style } : sticker
            )
        }));
    },

    updateStickerValue: (id: string, value: string) => {
        set((state) => ({
            stickers: state.stickers.map(sticker =>
                sticker.id === id ? { ...sticker, value } : sticker
            )
        }));
    },

    removeSticker: (id: string) => {
        set((state) => ({
            stickers: state.stickers.filter(sticker => sticker.id !== id)
        }));
    },

    getSticker: (id: string) => {
        return get().stickers.find(sticker => sticker.id === id);
    },
    
    nextStyle: (id: string) => {
        console.log('nextStyle', id);
        set((state) => {
            const stickers = state.stickers;
            const stickerIndex = stickers.findIndex(sticker => sticker.id === id);
            if (stickerIndex === -1) return { stickers };

            const sticker = stickers[stickerIndex];
            const nextStyle = getNextStyleId(sticker.type, sticker.style);
            console.log('nextStyle', nextStyle);
            stickers[stickerIndex] = { ...sticker, style: nextStyle };
            
            return { stickers };
        });
    },
})); 

/**
 * Jotai atom for the sticker being edited
 */
export const editStickerAtom = atom<Sticker | null>(null);

function getNextStyleId(type: NDKStoryStickerType, style?: string): string {
    switch (type) {
        case NDKStoryStickerType.Text: return getNextTextStyleName(style)
        case NDKStoryStickerType.Pubkey: return getNextMentionStyleName(style)
        default: return '';
    }
}