import '@bacons/text-decoder/install';
import { create } from 'zustand';

type PublishStoreState = {
    caption: string;
    setCaption: (caption: string) => void;

    expiration: number | null;
    setExpiration: (expiration: number | null) => void;

    tags: string[];
    setTags: (tags: string[]) => void;
};

export const publishStore = create<PublishStoreState>((set) => ({
    caption: '',
    setCaption(caption: string): void {
        set(() => ({ caption }));
    },

    tags: [],
    setTags(tags: string[]): void {
        set(() => ({ tags }));
    },

    expiration: null,
    setExpiration(expiration: number | null): void {
        set(() => ({ expiration }));
    },
}));