import '@bacons/text-decoder/install';
import { create } from 'zustand';

export type PostType = 'generic' | 'high-quality';

type PublishStoreState = {
    caption: string;
    setCaption: (caption: string) => void;

    expiration: number | null;
    setExpiration: (expiration: number | null) => void;

    tags: string[];
    setTags: (tags: string[]) => void;

    type: PostType;
    setType: (type: PostType) => void;

    reset: () => void;
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

    reset(): void {
        set(() => ({
            media: [],
            caption: '',
            tags: [],
            expiration: null,
            type: 'high-quality',
        }));
    },

    type: 'high-quality',
    setType(type: PostType): void {
        set(() => ({ type }));
    },
}));
