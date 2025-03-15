import React, { createContext, useContext, useState } from 'react';
import { Dimensions } from 'react-native';
import { EnhancedTextStyle, getEnhancedStyleById } from '../styles/enhancedTextStyles';
import { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface Sticker {
    id: string;
    type: 'text' | 'mention' | 'nostrEvent' | 'countdown';
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
            styleId: 'neon-glow', // Default to our first enhanced style
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
            content: profile.name || profile.displayName || profile.pubkey,
            styleId: 'neon-glow',
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
            styleId: 'neon-glow',
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
            styleId: 'neon-glow',
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
    if (!context) {
        throw new Error('useStickers must be used within a StickerProvider');
    }
    return context;
} 