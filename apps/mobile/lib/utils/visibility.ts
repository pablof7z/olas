import type { VisibilityType } from '@/lib/publish/types';

export function getVisibilityLabel(visibility: VisibilityType): string {
    switch (visibility) {
        case 'text-apps':
            return 'Text Apps';
        case 'media-apps':
            return 'Media Apps';
        default:
            return visibility;
    }
} 