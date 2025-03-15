import React, { createContext, useContext, useState } from 'react';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface Sticker {
    id: string;
    type: 'text';
    content: string;
    transform: {
        translateX: number;
        translateY: number;
        scale: number;
        rotate: number;
    };
}

interface StickerContextType {
    stickers: Sticker[];
    addTextSticker: (text: string) => string;
    updateSticker: (id: string, transform: Sticker['transform']) => void;
    removeSticker: (id: string) => void;
    getSticker: (id: string) => Sticker | undefined;
}

const StickerContext = createContext<StickerContextType | null>(null);

export function StickerProvider({ children }: { children: React.ReactNode }) {
    const [stickers, setStickers] = useState<Sticker[]>([]);

    const addTextSticker = (text: string) => {
        const id = `sticker-${Date.now()}`;
        const newSticker: Sticker = {
            id,
            type: 'text',
            content: text,
            transform: {
                translateX: SCREEN_WIDTH / 2,
                translateY: SCREEN_HEIGHT / 2,
                scale: 1,
                rotate: 0,
            },
        };
        setStickers((prev) => [...prev, newSticker]);
        return id;
    };

    const updateSticker = (id: string, transform: Sticker['transform']) => {
        setStickers((prev) =>
            prev.map((sticker) =>
                sticker.id === id ? { ...sticker, transform } : sticker
            )
        );
    };

    const removeSticker = (id: string) => {
        setStickers((prev) => prev.filter((sticker) => sticker.id !== id));
    };

    const getSticker = (id: string) => {
        return stickers.find((sticker) => sticker.id === id);
    };

    return (
        <StickerContext.Provider
            value={{
                stickers,
                addTextSticker,
                updateSticker,
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