import type { FeedEntry } from '@/components/Feed/hook';

// TODO: Replace with actual implementation or import
const imageOrVideoUrlRegexp = /\\.(jpg|jpeg|png|gif|mp4|webm)$/i;
const knownKind1s = new Map<string, boolean>();

export const postFilterFn = (entry: FeedEntry): boolean => {
    const event = entry.events[0];
    if (event?.kind === 1) {
        let val = knownKind1s.get(event.id);
        if (val !== undefined) return val;

        if (event.hasTag('e')) val = false;
        else val = !!event.content.match(imageOrVideoUrlRegexp);
        knownKind1s.set(event.id, val);

        return val;
    }

    return true;
};
