import { StickerStyle } from '@/lib/story-editor/types';
import { NDKStoryStickerType } from '@/lib/story-editor/types';
import { registerStickerStyles } from '@/lib/story-editor/styles/stickerStyles';

// Define 10 different styles for NostrFilter stickers
const nostrFilterStickerStyles: StickerStyle[] = [
    {
        id: 'default',
        name: 'Default',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 16,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: 'white',
    },
    {
        id: 'filter',
        name: 'Filter',
        backgroundColor: 'rgba(63, 81, 181, 0.8)',
        borderRadius: 12,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: 'white',
    },
    {
        id: 'code',
        name: 'Code',
        backgroundColor: 'rgba(33, 33, 33, 0.9)',
        borderRadius: 8,
        color: '#4caf50',
        fontSize: 14,
        fontWeight: 'normal',
        iconColor: '#4caf50',
    },
    {
        id: 'card',
        name: 'Card',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: '#1e88e5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    {
        id: 'nostr',
        name: 'Nostr',
        backgroundColor: 'rgba(128, 0, 128, 0.7)',
        borderRadius: 12,
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: '#ffd700',
    },
    {
        id: 'ghost',
        name: 'Ghost',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        color: 'white',
        fontSize: 16,
        fontWeight: 'normal',
        iconColor: 'rgba(255, 255, 255, 0.9)',
    },
    {
        id: 'pill',
        name: 'Pill',
        backgroundColor: 'rgba(0, 150, 136, 0.8)',
        borderRadius: 30,
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        iconColor: 'white',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 4,
        color: 'white',
        fontSize: 14,
        fontWeight: 'normal',
        iconColor: 'white',
    },
    {
        id: 'glass',
        name: 'Glass',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: 'white',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    {
        id: 'outlined',
        name: 'Outlined',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#3f51b5',
        borderRadius: 8,
        color: '#3f51b5',
        fontSize: 16,
        fontWeight: 'bold',
        iconColor: '#3f51b5',
    },
];

// Register the styles
registerStickerStyles(NDKStoryStickerType.NostrFilter, nostrFilterStickerStyles);

export default nostrFilterStickerStyles; 