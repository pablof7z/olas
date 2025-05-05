import Feed from '@/components/Feed';
import type { FeedEntry } from '@/components/Feed/hook';
import { imageOrVideoUrlRegexp } from '@/utils/media';
import { type NDKFilter, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import type { FlashList } from '@shopify/flash-list';
import { useAtom } from 'jotai';
import type React from 'react';
import { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedRef, useAnimatedScrollHandler } from 'react-native-reanimated';
import { profileContentViewAtom } from '../atoms';

const knownKind1s = new Map<string, boolean>();

const postFilterFn = (entry: FeedEntry) => {
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

type ProfileContentProps = {
    pubkey: string;
    hasProducts: boolean;
    scrollY: SharedValue<number>;
    colors: Record<string, string>;
};

const ProfileContent: React.FC<ProfileContentProps> = ({
    pubkey,
    hasProducts,
    scrollY,
    colors,
}) => {
    const [view] = useAtom(profileContentViewAtom);

    const { filters, filterKey, filterFn, numColumns } = useMemo<{
        filters: NDKFilter[];
        filterKey: string;
        filterFn: (entry: FeedEntry) => boolean;
        numColumns: number;
    }>(() => {
        let numColumns = 3;
        let assignedFilterFn: (entry: FeedEntry) => boolean | undefined = () => true;
        const res: NDKFilter[] = [];
        const currentView = view ?? 'posts';
        const filterKey = pubkey + currentView;

        if (currentView === 'posts') {
            res.push({ kinds: [NDKKind.Text], authors: [pubkey] });
            assignedFilterFn = postFilterFn;
            numColumns = 1;
        } else if (currentView === 'reels') {
            res.push({ kinds: [NDKKind.VerticalVideo, 21], authors: [pubkey] });
            numColumns = 3;
        } else if (currentView === 'photos') {
            res.push({ kinds: [NDKKind.Image], authors: [pubkey] });
            res.push({ kinds: [NDKKind.Text], '#k': ['20'], authors: [pubkey] });
            numColumns = 3;
        } else if (currentView === 'products') {
            res.push({ kinds: [30402], authors: [pubkey] });
            numColumns = 2;
        } else {
            res.push({ kinds: [NDKKind.Text], authors: [pubkey] });
            assignedFilterFn = postFilterFn;
            numColumns = 1;
        }

        const filterFn = (entry: FeedEntry): boolean => {
            const result = assignedFilterFn(entry);
            return result === true;
        };

        return { filters: res, filterKey: filterKey, filterFn, numColumns };
    }, [view, pubkey]);

    // Use Reanimated's native scroll handler
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Use Reanimated's animated ref for scrollable
    const animatedFeedRef = useAnimatedRef<FlashList<any>>();

    return (
        <Feed
            ref={animatedFeedRef}
            filters={filters}
            filterKey={filterKey}
            filterFn={filterFn}
            numColumns={numColumns}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
        />
    );
};

export default ProfileContent;
