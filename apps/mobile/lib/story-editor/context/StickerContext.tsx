import React, { createContext, useContext, useState } from 'react';
import { Dimensions } from 'react-native';
import { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { getDefaultStyleIdForStickerType } from '../styles/stickerStyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface Sticker {
    id: string;
    type: 'text' | 'mention' | 'nostrEvent' | 'countdown' | 'nostrFilter' | 'prompt';
    content: string;
    styleId: string;
    transform: {
        translateX: number;
        translateY: number;
        scale: number;
        rotate: number;
    };
    metadata?: {
        profile?: NDKUserProfile;
        eventId?: string;
        endTime?: Date;
    };
}

interface StickerContextType {
    stickers: Sticker[];
    addTextSticker: (text: string) => string;
    addMentionSticker: (profile: NDKUserProfile) => string;
    addNostrEventSticker: (eventId: string, title: string) => string;
    addCountdownSticker: (name: string, endTime: Date) => string;
    addNostrFilterSticker: (filter: string) => string;
    addPromptSticker: (prompt: string) => string;
    updateSticker: (id: string, transform: Sticker['transform']) => void;
    updateStickerStyle: (id: string, styleId: string) => void;
    removeSticker: (id: string) => void;
    getSticker: (id: string) => Sticker | undefined;
}

const StickerContext = createContext<StickerContextType | undefined>(undefined);

export function StickerProvider({ children }: { children: React.ReactNode }) {
    const [stickers, setStickers] = useState<Sticker[]>([]);

    const addTextSticker = (text: string) => {
        const id = Math.random().toString();
        const newSticker: Sticker = {
            id,
            type: 'text',
            content: text,
            styleId: getDefaultStyleIdForStickerType('text'),
            transform: {
                translateX: SCREEN_WIDTH / 2 - 50,
                translateY: SCREEN_HEIGHT / 2 - 50,
                scale: 1,
                rotate: 0,
            },
        };
        setStickers(prev => [...prev, newSticker]);
        return id;
    };
    
    const addMentionSticker = (profile: NDKUserProfile) => {
        const id = Math.random().toString();
        const newSticker: Sticker = {
            id,
            type: 'mention',
            content: profile.displayName || profile.name || 'Unknown',
            styleId: getDefaultStyleIdForStickerType('mention'),
            transform: {
                translateX: SCREEN_WIDTH / 2 - 50,
                translateY: SCREEN_HEIGHT / 2 - 50,
                scale: 1,
                rotate: 0,
            },
            metadata: {
                profile,
            },
        };
        setStickers(prev => [...prev, newSticker]);
        return id;
    };
    
    const addNostrEventSticker = (eventId: string, title: string) => {
        const id = Math.random().toString();
        const newSticker: Sticker = {
            id,
            type: 'nostrEvent',
            content: title,
            styleId: getDefaultStyleIdForStickerType('nostrEvent'),
            transform: {
                translateX: SCREEN_WIDTH / 2 - 50,
                translateY: SCREEN_HEIGHT / 2 - 50,
                scale: 1,
                rotate: 0,
            },
            metadata: {
                eventId,
            },
        };
        setStickers(prev => [...prev, newSticker]);
        return id;
    };

    const addCountdownSticker = (name: string, endTime: Date) => {
        const id = Math.random().toString();
        const newSticker: Sticker = {
            id,
            type: 'countdown',
            content: name || 'Countdown',
            styleId: getDefaultStyleIdForStickerType('countdown'),
            transform: {
                translateX: SCREEN_WIDTH / 2 - 50,
                translateY: SCREEN_HEIGHT / 2 - 50,
                scale: 1,
                rotate: 0,
            },
            metadata: {
                endTime,
            },
        };
        setStickers(prev => [...prev, newSticker]);
        return id;
    };

    const addNostrFilterSticker = (filter: string) => {
        const id = Math.random().toString();
        const newSticker: Sticker = {
            id,
            type: 'nostrFilter',
            content: filter,
            styleId: getDefaultStyleIdForStickerType('nostrFilter'),
            transform: {
                translateX: SCREEN_WIDTH / 2 - 50,
                translateY: SCREEN_HEIGHT / 2 - 50,
                scale: 1,
                rotate: 0,
            },
        };
        setStickers(prev => [...prev, newSticker]);
        return id;
    };

    const addPromptSticker = (prompt: string) => {
        const id = Math.random().toString();
        const newSticker: Sticker = {
            id,
            type: 'prompt',
            content: prompt,
            styleId: getDefaultStyleIdForStickerType('prompt'),
            transform: {
                translateX: SCREEN_WIDTH / 2 - 50,
                translateY: SCREEN_HEIGHT / 2 - 50,
                scale: 1,
                rotate: 0,
            },
        };
        setStickers(prev => [...prev, newSticker]);
        return id;
    };

    const updateSticker = (id: string, transform: Sticker['transform']) => {
        setStickers(prev =>
            prev.map(sticker =>
                sticker.id === id ? { ...sticker, transform } : sticker
            )
        );
    };

    const updateStickerStyle = (id: string, styleId: string) => {
        setStickers(prev =>
            prev.map(sticker =>
                sticker.id === id ? { ...sticker, styleId } : sticker
            )
        );
    };

    const removeSticker = (id: string) => {
        setStickers(prev => prev.filter(sticker => sticker.id !== id));
    };

    const getSticker = (id: string) => {
        return stickers.find(sticker => sticker.id === id);
    };

    return (
        <StickerContext.Provider
            value={{
                stickers,
                addTextSticker,
                addMentionSticker,
                addNostrEventSticker,
                addCountdownSticker,
                addNostrFilterSticker,
                addPromptSticker,
                updateSticker,
                updateStickerStyle,
                removeSticker,
                getSticker,
            }}
        >
            {children}
        </StickerContext.Provider>
    );
}

export function useStickers() {
    const context = useContext(StickerContext);
    if (context === undefined) {
        throw new Error('useStickers must be used within a StickerProvider');
    }
    return context;
} 