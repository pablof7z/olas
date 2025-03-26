import { useState } from 'react';
import { useStickerStore, editStickerAtom } from '../store';
import { useAtom, useAtomValue } from 'jotai';
import { stickersSheetRefAtom } from '../atoms/stickersSheet';
import { NDKStoryStickerType } from '@nostr-dev-kit/ndk-mobile';

export const useStickerManagement = () => {
    const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
    const { stickers, removeSticker, addSticker } = useStickerStore();
    const stickersSheetRef = useAtomValue(stickersSheetRefAtom);
    const [editSticker, setEditSticker] = useAtom(editStickerAtom);

    const handleStickerSelect = (id: string) => {
        setSelectedStickerId(id);
    };

    const handleDeleteSelected = () => {
        if (selectedStickerId) {
            removeSticker(selectedStickerId);
            setSelectedStickerId(null);
        }
    };

    const openStickersDrawer = () => {
        stickersSheetRef?.current?.present();
    };

    const handleAddTextSticker = () => {
        setEditSticker({
            id: '',
            type: NDKStoryStickerType.Text,
            value: '',
            transform: { translateX: 0, translateY: 0, scale: 1, rotate: 0 },
        });
    };

    const isEditingText = editSticker?.type === NDKStoryStickerType.Text;

    return {
        selectedStickerId,
        stickers,
        isEditingText,
        handleStickerSelect,
        handleDeleteSelected,
        openStickersDrawer,
        handleAddTextSticker,
    };
};
