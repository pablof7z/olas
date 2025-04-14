import { useHeaderHeight } from '@react-navigation/elements';
import { Stack } from 'expo-router';
import { useAtomValue } from 'jotai';
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Feed from '@/components/Feed';
import type { FeedEntry } from '@/components/Feed/hook';
import { feedTypeAtom } from '@/components/FeedType/store';
import HomeHeader from '@/components/Headers/Home';
import { searchQueryAtom } from '@/components/Headers/Home/store';
import UploadIndicator from '@/components/UploadIndicator';
import { useAllFollows } from '@/hooks/follows';
import { useIsSavedSearch } from '@/hooks/saved-search';
import { Stories } from '@/lib/stories/components/feed-item';
import { useColorScheme } from '@/lib/useColorScheme';
import { videoKinds } from '@/utils/const';
import { imageOrVideoUrlRegexp } from '@/utils/media';
import { Hexpubkey, NDKEvent, NDKEventId, NDKFilter, NDKKind, NDKSubscription, useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks';

export default function HomeScreen() {
    const { colors } = useColorScheme();

    console.log('Rendering <HomeScreen>');

    const style = useMemo<ViewStyle>(
        () => ({
            flex: 1,
            backgroundColor: colors.card,
        }),
        [colors.card]
    );

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    header: () => <HomeHeader />,
                }}
            />

            <View style={style}>
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

        sub.current = ndk.subscribe(bookmarksFilters, { ...bookmarksOpts, relaySet: undefined }, false);

        sub.current.on('event', (event: NDKEvent) => {
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
    let _run = 0;
    let unfollowedPubkeysRecentlyShown: Hexpubkey[] = [];

    return (feedEntry: FeedEntry, index: number) => {
        if (index === 0) {
            unfollowedPubkeysRecentlyShown = [];
            _run++;
        }

        if (feedFilters.kind1MustHaveMedia(feedEntry, index, followSet) === false) return false;
        if (feedFilters.videosMustBeFromFollows(feedEntry, index, followSet) === false)
            return false;

        const pubkey = feedEntry.event?.pubkey;
        const isFollowed = pubkey ? followSet.has(pubkey) : false;
        if (!isFollowed) {
            // this is an unfollowed pubkey, check if they were recently shown
            const recentTimesThisPubkeyWasShown = unfollowedPubkeysRecentlyShown.filter(
                (p) => p === pubkey // Use the defined pubkey variable
            ).length;

            if (recentTimesThisPubkeyWasShown >= FOR_YOU_UNFOLLOWED_POST_THRESHOLD) {
                return false;
            }

            if (pubkey) unfollowedPubkeysRecentlyShown.push(pubkey); // Only push if pubkey is defined

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
        key: `hashtag-${hashtag}`,
        filterFn: null,
        relayUrls: undefined,
        numColumns: 3,
    };
}

function textSearch(text: string) {
    return {
        filters: [{ kinds: [NDKKind.Image], search: text }],
        key: `search-${text}`,
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
    const withTweets = useMemo(
        () => feedType.kind === 'search' && !isSavedSearch,
        [feedType.kind, isSavedSearch]
    );

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
            // Ensure feedType.value is a string before using it in the #h filter
            const groupHashTag = typeof feedType.value === 'string' ? [feedType.value] : [];
            return {
                filters: [
                    { kinds: [NDKKind.Image, NDKKind.VerticalVideo], '#h': groupHashTag },
                ],
                key: `groups-${feedType.value ?? 'unknown'}`,
                filterFn: null,
                relayUrls: feedType.relayUrls,
            };
        } else if (feedType.kind === 'discover' && feedType.value === 'bookmark-feed') {
            if (bookmarkIdsForFilter.length === 0) return { filters: undefined, key: 'empty' };
            return {
                filters: [{ ids: bookmarkIdsForFilter }],
                key: `bookmark-feed${bookmarkIdsForFilter.length}`,
                numColumns: 1,
            };
        }

        const keyParts = [currentUser?.pubkey ?? ''];
        if (feedType.hashtags && feedType.kind === 'search') keyParts.push(feedType.hashtags?.join(' '));
        else if (feedType.value) keyParts.push(feedType.value);

        let hashtagFilter: NDKFilter = {};

        if (feedType.kind === 'search') {
            hashtagFilter = { '#t': feedType.hashtags };
            if (!isSavedSearch) numColumns = 3;
        }

        const filters: NDKFilter[] = [];

        // filters.push({ kinds: [1] });
        filters.push({
            kinds: [NDKKind.Image, NDKKind.VerticalVideo, 21, 22],
            ...hashtagFilter,
            limit: 500,
        });
        filters.push({
            kinds: [NDKKind.Text, NDKKind.Repost, NDKKind.GenericRepost],
            '#k': ['20', '21', '22'],
            ...hashtagFilter,
            limit: 50,
        });

        if (withTweets) {
            filters.push({ kinds: [1], limit: 50, ...hashtagFilter });
        }

        let filterFn = null;

        if (feedType.kind === 'discover' && feedType.value === 'follows') {
            filterFn = (feedEntry: FeedEntry, index: number) => {
                if (feedFilters.kind1MustHaveMedia(feedEntry, index, followSet) === false)
                    return false;
                const pubkey = feedEntry.event?.pubkey;
                return pubkey ? followSet.has(pubkey) : false;
            };
        } else if (feedType.kind === 'discover' && feedType.value === 'for-you') {
            filterFn = forYouFilter(followSet);
        } else if (feedType.kind !== 'search') {
            filterFn = (feedEntry: FeedEntry, index: number) => {
                if (feedFilters.kind1MustHaveMedia(feedEntry, index, followSet) === false)
                    return false;
                if (feedFilters.videosMustBeFromFollows(feedEntry, index, followSet) === false)
                    return false;

                const event = feedEntry.event;
                if (!event) return false; // Need event to check pubkey/kind

                const isFollowed = followSet.has(event.pubkey);
                if (isFollowed) return true;
                if (feedType.kind === 'discover' && feedType.value === 'follows') return false;

                const isVideo = videoKinds.has(event.kind);

                return !isVideo || isFollowed;
            };
        }

        return { filters, key: keyParts.join(), filterFn, numColumns };
    }, [
        followSet.size,
        withTweets,
        feedType.value,
        currentUser?.pubkey,
        bookmarkIdsForFilter.length,
        isSavedSearch,
        searchQuery,
    ]);

    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    const { colors } = useColorScheme();

    return (
        <View style={{ flex: 1 }}>
            <Feed
                prepend={<Stories style={{ marginTop: headerHeight }} />}
                filters={filters ?? []}
                relayUrls={relayUrls}
                filterKey={key}
                filterFn={filterFn ?? undefined}
                numColumns={numColumns}
            />
        </View>
    );
}

const kind1MustHaveMedia = (feedEntry: FeedEntry): boolean => {
    const event = feedEntry.event;
    // If no event, assume it passes this filter. Adjust if different logic is needed.
    if (!event) return true;

    // if it's a kind 1, make sure we have a URL of an image or video
    if (event.kind === 1) {
        const imeta = event.tagValue('imeta');
        if (imeta) return true;
        const matches = event.content.match(imageOrVideoUrlRegexp);
        return matches !== null;
    }

    // If event.kind is not 1, it passes this specific filter
    return true;
};

const videosMustBeFromFollows = (feedEntry: FeedEntry, _index: number, followSet: Set<string>) => {
    const event = feedEntry.event;
    if (!event) return true; // If no event, can't be a video from non-follow

    if (videoKinds.has(event.kind)) {
        return followSet.has(event.pubkey);
    }
    return true;
};

type FeedFilterFn = (feedEntry: FeedEntry, index: number, followSet: Set<string>) => boolean;

const feedFilters: Record<string, FeedFilterFn> = {
    kind1MustHaveMedia,
    videosMustBeFromFollows,
};
