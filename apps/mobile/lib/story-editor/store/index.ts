import { create } from 'zustand';
import { Dimensions } from 'react-native';
import { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { NDKStoryStickerType } from '../types';
import { UserProfile } from '@/hooks/user-profile';
import { atom } from 'jotai';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface Sticker {
    id: string;
    type: NDKStoryStickerType;
    content: string;
    styleId?: string;
    transform: {
        translateX: number;
        translateY: number;
        scale: number;
        rotate: number;
    };
    metadata?: {
        profile?: UserProfile;
        eventId?: string;
        endTime?: Date;
    };
}

interface StickerState {
    stickers: Sticker[];
    addSticker: (sticker: Omit<Sticker, 'id' | 'transform'> & { transform?: Partial<Sticker['transform']> }) => string;
    updateSticker: (id: string, transform: Sticker['transform']) => void;
    updateStickerStyle: (id: string, styleId: string) => void;
    updateStickerContent: (id: string, content: string) => void;
    removeSticker: (id: string) => void;
    getSticker: (id: string) => Sticker | undefined;
}

export const useStickerStore = create<StickerState>((set, get) => ({
    stickers: [],
    
    addSticker: (stickerData) => {
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
            content: stickerData.content,
            styleId: stickerData.styleId,
            transform: {
                ...defaultTransform,
                ...stickerData.transform
            },
            metadata: stickerData.metadata,
        };
        
        set((state) => ({ stickers: [...state.stickers, newSticker] }));
        return id;
    },

    updateSticker: (id: string, transform: Sticker['transform']) => {
        set((state) => ({
            stickers: state.stickers.map(sticker =>
                sticker.id === id ? { ...sticker, transform } : sticker
            )
        }));
    },

    updateStickerStyle: (id: string, styleId: string) => {
        set((state) => ({
            stickers: state.stickers.map(sticker =>
                sticker.id === id ? { ...sticker, styleId } : sticker
            )
        }));
    },

    updateStickerContent: (id: string, content: string) => {
        set((state) => ({
            stickers: state.stickers.map(sticker =>
                sticker.id === id ? { ...sticker, content } : sticker
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
})); 

export const editStickerAtom = atom<Sticker | null>(null);