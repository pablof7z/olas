import { Hexpubkey, NDKEventId, NDKSubscription } from '@nostr-dev-kit/ndk-mobile';
import { NDKFilter, NDKKind } from '@nostr-dev-kit/ndk-mobile';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { useAtomValue } from 'jotai';
import Feed from '@/components/Feed';

import { videoKinds } from '@/utils/const';
import { FeedEntry } from '@/components/Feed/hook';
import { feedTypeAtom } from '@/components/FeedType/store';
import HomeHeader from '@/components/Headers/Home';
import { useIsSavedSearch } from '@/hooks/saved-search';
import { searchQueryAtom } from '@/components/Headers/Home/store';
import { useAllFollows } from '@/hooks/follows';
import { imageOrVideoUrlRegexp } from '@/utils/media';
import { Stories } from '@/lib/stories/components/feed-item';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UploadIndicator from '@/components/UploadIndicator';
// const explicitFeedAtom = atom<NDKFilter[], [NDKFilter[] | null], null>(null, (get, set, value) => set(explicitFeedAtom, value));

export default function HomeScreen() {
    const { colors } = useColorScheme();

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    header: () => <HomeHeader />,
                }}
            />

            <View style={{ flex: 1, backgroundColor: colors.card }}>
                <UploadIndicator />
                <DataList />
            </View>
        </>
    );
}

const bookmarksFilters = [{ kinds: [3006], '#k': ['20'] }];
const bookmarksOpts = { skipVerification: true, groupable: false, wrap: true };

function useBookmarkIds() {
    const { ndk } = useNDK();
    const sub = useRef<NDKSubscription | null>(null);
    const ids = new Set<string>();
    const eosed = useRef(false);
    const feedType = useAtomValue(feedTypeAtom);
    const [ret, setRet] = useState<NDKEventId[]>([]);

    useEffect(() => {
        if (!ndk) return;
        if (feedType.value !== 'bookmark-feed') {
            sub.current?.stop();
            sub.current = null;
            eosed.current = false;
            return;
        }

        if (sub.current) return;

        sub.current = ndk.subscribe(bookmarksFilters, bookmarksOpts, undefined, false);

        sub.current.on('event', (event) => {
            if (event.kind !== 3006) return;
            for (const tag of event.getMatchingTags('e')) {
                ids.add(tag[1]);
            }

            if (eosed.current) {
                setRet(Array.from(ids));
            }
        });

        sub.current.on('eose', () => {
            eosed.current = true;
            setRet(Array.from(ids));
        });

        sub.current.start();

        return () => {
            sub.current?.stop();
            sub.current = null;
            eosed.current = false;
        };
    }, [ndk, feedType]);

    return ret;
}

// how many posts does the time window take into account when deciding whether to show repeated unfollowed pubkeys
const FOR_YOU_ROLLING_POST_WINDOW_LENGTH = 10;

// how many times does an unfollowed pubkey need to be shown in the time window for extra posts to be hidden
const FOR_YOU_UNFOLLOWED_POST_THRESHOLD = 2;

function forYouFilter(followSet: Set<string>) {
    let run = 0;
    let unfollowedPubkeysRecentlyShown: Hexpubkey[] = [];

    return (feedEntry: FeedEntry, index: number) => {
        if (index === 0) {
            unfollowedPubkeysRecentlyShown = [];
            run++;
        }

        if (feedFilters.kind1MustHaveMedia(feedEntry, index, followSet) === false) return false;
        if (feedFilters.videosMustBeFromFollows(feedEntry, index, followSet) === false) return false;

        const isFollowed = followSet.has(feedEntry.event?.pubkey);
        if (!isFollowed) {
            // this is an unfollowed pubkey, check if they were recently shown
            const recentTimesThisPubkeyWasShown = unfollowedPubkeysRecentlyShown.filter((p) => p === feedEntry.event?.pubkey).length;

            if (recentTimesThisPubkeyWasShown >= FOR_YOU_UNFOLLOWED_POST_THRESHOLD) {
                return false;
            }

            unfollowedPubkeysRecentlyShown.push(feedEntry.event?.pubkey);

            // trim the time
            if (unfollowedPubkeysRecentlyShown.length > FOR_YOU_ROLLING_POST_WINDOW_LENGTH) {
                unfollowedPubkeysRecentlyShown.shift();
            }
        }

        return true;
    };
}

const nip50Relays = ['wss://relay.nostr.band'];

function hashtagSearch(hashtag: string) {
    const hashtagWithoutHash = hashtag.replace(/^#/, '');

    return {
        filters: [{ kinds: [NDKKind.Image, NDKKind.VerticalVideo], '#t': [hashtagWithoutHash] }],
        key: 'hashtag-' + hashtag,
        filterFn: null,
        relayUrls: undefined,
        numColumns: 3,
    };
}

function textSearch(text: string) {
    return {
        filters: [{ kinds: [NDKKind.Image], search: text }],
        key: 'search-' + text,
        filterFn: null,
        relayUrls: nip50Relays,
        numColumns: 3,
    };
}

function DataList() {
    const feedType = useAtomValue(feedTypeAtom);
    const currentUser = useNDKCurrentUser();
    const follows = useAllFollows();
    const bookmarkIds = useBookmarkIds();

    const isSavedSearch = useIsSavedSearch();
    const withTweets = useMemo(() => feedType.kind === 'search' && !isSavedSearch, [feedType.kind, isSavedSearch]);

    const bookmarkIdsForFilter = useMemo(() => {
        if (feedType.kind === 'discover' && feedType.value === 'bookmark-feed') return bookmarkIds;
        return [];
    }, [bookmarkIds.length, feedType]);

    const followSet = useMemo(() => {
        const set = new Set(follows);
        if (currentUser) set.add(currentUser.pubkey);
        return set;
    }, [currentUser?.pubkey, follows.size]);

    const searchQuery = useAtomValue(searchQueryAtom);

    const { filters, key, filterFn, relayUrls, numColumns } = useMemo(() => {
        let numColumns = 1;
        if (searchQuery) {
            // is a single word?
            if (!searchQuery.includes(' ')) return hashtagSearch(searchQuery);
            else return textSearch(searchQuery);
        } else if (feedType.kind === 'group') {
            return {
                filters: [{ kinds: [NDKKind.Image, NDKKind.VerticalVideo], '#h': [feedType.value] }],
                key: 'groups-' + feedType.value,
                filterFn: null,
                relayUrls: feedType.relayUrls,
            };
        } else if (feedType.kind === 'discover' && feedType.value === 'bookmark-feed') {
            if (bookmarkIdsForFilter.length === 0) return { filters: undefined, key: 'empty' };
            return {
                filters: [{ ids: bookmarkIdsForFilter }],
                key: 'bookmark-feed' + bookmarkIdsForFilter.length,
                numColumns: 1,
            };
        }

        const keyParts = [currentUser?.pubkey ?? ''];
        if (feedType.kind === 'search') keyParts.push(feedType.hashtags?.join(' '));
        else keyParts.push(feedType.value);

        let hashtagFilter: NDKFilter = {};

        if (feedType.kind === 'search') {
            hashtagFilter = { '#t': feedType.hashtags };
            if (!isSavedSearch) numColumns = 3;
        }

        const filters: NDKFilter[] = [];

        // filters.push({ kinds: [1] });
        filters.push({ kinds: [NDKKind.Image, NDKKind.VerticalVideo, 21, 22], ...hashtagFilter, limit: 500 });
        filters.push({ kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.GenericRepost], '#k': ['20'], ...hashtagFilter, limit: 50 });

        if (withTweets) {
            filters.push({ kinds: [1], limit: 50, ...hashtagFilter });
        }

        let filterFn = null;

        if (feedType.kind === 'discover' && feedType.value === 'follows') {
            filterFn = (feedEntry: FeedEntry, index: number) => {
                if (feedFilters.kind1MustHaveMedia(feedEntry, index, followSet) === false) return false;
                return followSet.has(feedEntry.event?.pubkey);
            };
        } else if (feedType.kind === 'discover' && feedType.value === 'for-you') {
            filterFn = forYouFilter(followSet);
        } else if (feedType.kind !== 'search') {
            filterFn = (feedEntry: FeedEntry, index: number) => {
                if (feedFilters.kind1MustHaveMedia(feedEntry, index, followSet) === false) return false;
                if (feedFilters.videosMustBeFromFollows(feedEntry, index, followSet) === false) return false;

                const isFollowed = followSet.has(feedEntry.event?.pubkey);
                if (isFollowed) return true;
                if (feedType.kind === 'discover' && feedType.value === 'follows') return false;

                const isVideo = videoKinds.has(feedEntry.event?.kind);

                return !isVideo || isFollowed;
            };
        }

        return { filters, key: keyParts.join(), filterFn, numColumns };
    }, [followSet.size, withTweets, feedType.value, currentUser?.pubkey, bookmarkIdsForFilter.length, isSavedSearch, searchQuery]);

    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    const { colors } = useColorScheme();

    return (
        <View style={{ flex: 1, paddingTop: insets.top }}>
            <Feed
                prepend={<Stories style={{ marginTop: headerHeight - insets.top }} />}
                filters={filters}
                relayUrls={relayUrls}
                filterKey={key}
                filterFn={filterFn}
                numColumns={numColumns}
            />
        </View>
    );
}

const kind1MustHaveMedia = (feedEntry: FeedEntry) => {
    // if it's a kind 1, make sure we have a URL of an image or video
    if (feedEntry.event?.kind === 1) {
        const imeta = feedEntry.event?.tagValue('imeta');
        if (imeta) return true;
        const matches = feedEntry.event?.content.match(imageOrVideoUrlRegexp);
        return matches !== null;
    }
};

const videosMustBeFromFollows = (feedEntry: FeedEntry, index: number, followSet: Set<string>) => {
    if (videoKinds.has(feedEntry.event?.kind)) {
        return followSet.has(feedEntry.event?.pubkey);
    }
    return true;
};

type FeedFilterFn = (feedEntry: FeedEntry, index: number, followSet: Set<string>) => boolean;

const feedFilters: Record<string, FeedFilterFn> = {
    kind1MustHaveMedia,
    videosMustBeFromFollows,
};
