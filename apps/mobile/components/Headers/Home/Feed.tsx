import { useFeedTypeBottomSheet } from "@/components/FeedType/hook";
import { FeedType, feedTypeAtom, searchInputRefAtom } from "@/components/FeedType/store";
import { useGroup } from "@/lib/groups/store";
import { useColorScheme } from "@/lib/useColorScheme";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-mobile";
import { useAtom, useAtomValue } from "jotai";
import { X, Search, ChevronDown } from "lucide-react-native";
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { View, Pressable, StyleSheet, Animated } from "react-native";
import { Image } from 'expo-image';
import { Text } from "@/components/nativewindui/Text";
import SearchInput from "./Search";
import { Button } from "@/components/nativewindui/Button";
import { useAppSettingsStore } from "@/stores/app";
import { useIsSavedSearch } from "@/hooks/saved-search";
import { searchQueryAtom, useSearchQuery } from "./store";
import { feedEditorBottomSheetRefAtom } from "@/lib/feed-editor/store";
import { useFeedEditorStore } from "@/lib/feed-editor/store";

export default function Feed() {
    const [feedType, setFeedType] = useAtom(feedTypeAtom);
    const { colors } = useColorScheme();
    const { show: showSheet } = useFeedTypeBottomSheet();
    const group = useGroup(feedType.kind === 'group' ? feedType.value : undefined, feedType.kind === 'group' ? feedType.relayUrls[0] : undefined);
    const currentUser = useNDKCurrentUser();
    const searchInputRef = useAtomValue(searchInputRefAtom);
    const searchQuery = useAtomValue(searchQueryAtom);
    const setSearchQuery = useSearchQuery();

    const feedTypeTitle = useMemo(() => {
        if (feedType.kind === 'discover' && feedType.value === 'follows') return 'Follows';
        if (feedType.kind === 'discover' && feedType.value === 'for-you') {
            if (!currentUser) return 'Home';
            return 'For you';
        }
        if (feedType.kind === 'discover' && feedType.value === 'bookmark-feed') return 'Bookmarks';
        return feedType.value;
    }, [feedType, currentUser?.pubkey]);

    const slideAnim = useRef(new Animated.Value(0)).current;
    
    const showSearchInput = useMemo(() => (searchQuery !== null), [searchQuery])

    const toggleSearch = useCallback(() => {
        if (searchQuery !== null) {
            setSearchQuery(null);
        } else {
            setSearchQuery("");
            if (!showSearchInput) {
                searchInputRef?.current?.focus();
            }
        }
    }, [searchQuery, setSearchQuery, showSearchInput])

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: showSearchInput ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // if (feedType.kind === 'search' && searchQuery !== feedType.value) {
        //     setSearchQuery(feedType.value);
        // }
    }, [searchQuery, feedType?.value]);

    return (
        <View style={styles.container}>
            <Pressable style={styles.searchButton} onPress={toggleSearch}>
                {showSearchInput ? (
                    <X size={24} color={colors.foreground} />
                ) : (
                    <Search size={24} color={colors.foreground} />
                )}
            </Pressable>
            <Animated.View style={[
                styles.animatedContainer,
                { 
                    transform: [{ translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [100, 0]
                    })}],
                    opacity: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1]
                    }),
                    pointerEvents: showSearchInput ? 'auto' : 'none'
                }
            ]}>
                <SearchInput />
                <SaveSearchButton />
            </Animated.View>
            <Animated.View style={[
                styles.animatedContainer,
                { 
                    transform: [{ translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -100]
                    })}],
                    opacity: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0]
                    }),
                    pointerEvents: showSearchInput ? 'none' : 'auto'
                },
                {
                    width: '100%',
                    flex: 1,
                    paddingRight: 40,
                }
            ]}>
                <Pressable style={styles.button} onPress={showSheet}>
                    {group ? (
                        <>
                            <Image source={{ uri: group.picture }} style={{ width: 24, height: 24, borderRadius: 4 }} />
                            <Text className="text-xl font-semibold text-foreground truncate">{group.name}</Text>
                        </>) : (<>
                            <Text numberOfLines={1} className="text-2xl font-bold text-foreground whitespace-nowrap">{feedTypeTitle}</Text>
                        </>)
                    }

                    <ChevronDown size={16} color={colors.foreground} />
                    <View style={{ flex: 1 }} />
                    <SaveSearchButton />
                </Pressable>
            </Animated.View>
        </View>
    );  
}

function SaveSearchButton() {
    const [feedType, setFeedType] = useAtom(feedTypeAtom);
    const addSavedSearch = useAppSettingsStore(s => s.addSavedSearch);
    const searchQuery = useAtomValue(searchQueryAtom);
    const hashtag = searchQuery?.startsWith('#') ? searchQuery : `#${searchQuery}`;
    const withoutHashtag = searchQuery?.replace(/^#/, '');
    const setSearchQuery = useSearchQuery();
    
    const isSavedSearch = useIsSavedSearch();

    const saveSearch = useCallback(() => {
        addSavedSearch({
            title: hashtag,
            subtitle: withoutHashtag,
            hashtags: [withoutHashtag],
            lastUsedAt: Date.now()
        })

        setFeedType({ kind: 'search', value: hashtag, hashtags: [withoutHashtag] });
        setSearchQuery(null);
    }, [feedType, addSavedSearch, hashtag, withoutHashtag, setSearchQuery])

    if (!searchQuery) return null;
    if (isSavedSearch) return null;
    
    return (<Button variant="primary" size="sm" onPress={saveSearch}>
        <Text>Save</Text>
    </Button>);
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 4,
        paddingTop: 5,
        paddingBottom: 5,
        flex: 1,
    },
    searchButton: {
        paddingLeft: 10,
    },
    button: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 10,
        justifyContent: 'space-between',
    },
    animatedContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        position: 'absolute',
        left: 40,
        right: 0,
    }
})