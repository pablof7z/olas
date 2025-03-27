import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import NDK, { type Hexpubkey, NDKUser, useNDK, useNDKCurrentUser, useFollows } from '@nostr-dev-kit/ndk-mobile';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { Hash } from 'lucide-react-native';
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './nativewindui/Button';
import { ListItem } from './nativewindui/List';

import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { Text } from '@/components/nativewindui/Text';
import { cn } from '@/lib/cn';
import { useColorScheme } from '@/lib/useColorScheme';
import { getPostsByUser } from '@/utils/db';
import { myFollows } from '@/utils/myfollows';

export const mountTagSelectorAtom = atom<boolean>(false);
export const tagSelectorBottomSheetRefAtom = atom<RefObject<BottomSheetModal> | null>(null);
export const tagSelectorBottomSheetCbAtom = atom<((tags: string[]) => void) | null>(null);

type TagEntry = {
    // This is the tag as we match for internally
    id: string;

    // This is the tag as we display to the user
    tag: string;

    // This is the count of how many times this tag has been used
    count: number;
};

export type TagSelectorProps = {
    initialTags?: string[];
    onTagsSelected?: (tags: string[]) => void;
    onTagsChanged?: (tags: string[]) => void;
};

export function TagSelectorBottomSheet({ initialTags = [], onTagsSelected, onTagsChanged }: TagSelectorProps) {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(tagSelectorBottomSheetRefAtom);
    const inset = useSafeAreaInsets();
    const [tags, setTags] = useState<string[]>(initialTags);
    const selectedTags = useRef<Set<string>>(new Set(initialTags));
    const [selectedCount, setSelectedCount] = useState(initialTags.length);
    const tagSelectorCb = useAtomValue(tagSelectorBottomSheetCbAtom);

    useEffect(() => {
        selectedTags.current.clear();
        for (const tag of tags) {
            selectedTags.current.add(tag);
        }
        setSelectedCount(selectedTags.current.size);
    }, [tags]);

    useEffect(() => {
        setBottomSheetRef(ref);
    }, [ref, setBottomSheetRef]);

    const handleTagsSelected = useCallback(() => {
        const selectedTagsArray = Array.from(selectedTags.current);
        if (onTagsSelected) {
            onTagsSelected(selectedTagsArray);
        }
        tagSelectorCb?.(selectedTagsArray);
    }, [onTagsSelected, tagSelectorCb]);

    const handleTagsChanged = useCallback(
        (newTags: string[]) => {
            setTags(newTags);
            if (onTagsChanged) {
                onTagsChanged(newTags);
            }
        },
        [onTagsChanged]
    );

    return (
        <Sheet ref={ref}>
            <BottomSheetView
                style={{ flexDirection: 'column', paddingBottom: inset.bottom, height: Dimensions.get('window').height * 0.8 }}>
                <View className="w-full flex-col gap-2 px-4 py-2">
                    <View className="w-full flex-row items-center justify-between">
                        <Text variant="title1" className="text-foreground">
                            Tag your post
                        </Text>
                        <Button size="sm" variant="primary" onPress={handleTagsSelected}>
                            <Text>Done</Text>
                        </Button>
                    </View>
                    <Text className="text-muted-foreground">Add some tags to help others find your post</Text>
                </View>

                <TagSelector initialTags={tags} onTagsChanged={handleTagsChanged} />
            </BottomSheetView>
        </Sheet>
    );
}

export function TagSelector({
    initialTags = [],
    onTagsChanged,
    onSelected,
}: {
    initialTags?: string[];
    onTagsChanged?: (tags: string[]) => void;
    onSelected?: (tag: string) => void;
}) {
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const follows = useFollows();
    const [search, setSearch] = useState('');
    const selectedTags = useRef<Set<string>>(new Set(initialTags));
    const [selectedCount, setSelectedCount] = useState(initialTags.length);

    const mountTagSelector = useAtomValue(mountTagSelectorAtom);

    useEffect(() => {
        selectedTags.current.clear();
        for (const tag of initialTags) {
            selectedTags.current.add(tag);
        }
        setSelectedCount(selectedTags.current.size);
    }, [initialTags]);

    const tagsToShow = useMemo(() => {
        if (!ndk || !currentUser || !mountTagSelector) return [];

        const followsToUse = follows?.length > 5 ? follows : myFollows;
        const alphanumSearch = search.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const result = getTagsToShow(ndk, currentUser, followsToUse, alphanumSearch);

        // if we have a search, let's sort by the fact that the tag actually matches, if it doesn't match, it should be lower
        if (alphanumSearch) {
            result
                .sort((a, b) => {
                    const aMatches = a.tag.toLowerCase().includes(alphanumSearch);
                    const bMatches = b.tag.toLowerCase().includes(alphanumSearch);
                    return aMatches ? -1 : bMatches ? 1 : 0;
                })
                .filter((tag) => tag.tag.toLowerCase().includes(alphanumSearch));
        }

        // if we have selected tags that are not in the result and we don't have a search active, let's add them to the top
        if (selectedTags.current.size > 0 && !alphanumSearch) {
            const selectedTagsToAdd = Array.from(selectedTags.current).filter((tag) => !result.some((t) => t.tag === tag));
            result.unshift(...selectedTagsToAdd.map((tag) => ({ id: tag, tag, count: 0 })));
        }

        return result;
    }, [ndk, currentUser?.pubkey, follows?.length, search, selectedTags.current, mountTagSelector]);

    const updateSelectedTags = useCallback(
        (tags: string[]) => {
            if (onTagsChanged) {
                onTagsChanged(tags);
            }
        },
        [onTagsChanged]
    );

    const addTagManually = useCallback(() => {
        if (!search) return;
        if (onSelected) {
            onSelected(search);
            setSearch('');
            return;
        }

        selectedTags.current.add(search);
        updateSelectedTags(Array.from(selectedTags.current));
        setSelectedCount(selectedTags.current.size);
        setSearch('');
    }, [search, setSearch, updateSelectedTags, onSelected]);

    const onItemPress = useCallback(
        (tag: string) => {
            if (onSelected) {
                onSelected(tag);
                setSearch('');
                return;
            }

            if (selectedTags.current.has(tag)) selectedTags.current.delete(tag);
            else selectedTags.current.add(tag);
            updateSelectedTags(Array.from(selectedTags.current));
            setSelectedCount(selectedTags.current.size);
            setSearch('');
        },
        [updateSelectedTags, setSelectedCount, setSearch, onSelected]
    );

    const { colors } = useColorScheme();

    const keyExtractor = (item: TagEntry) => item.tag;
    const renderItem = useCallback(
        ({ item, index }: { item: TagEntry; index: number }) => {
            const isSelected = selectedTags.current.has(item.tag);
            return (
                <ListItem
                    className={cn('ios:pl-0 pl-2')}
                    titleClassName={cn(isSelected && '!text-primary !font-bold')}
                    leftView={<Hash size={24} color={isSelected ? colors.primary : colors.muted} style={{ marginHorizontal: 10 }} />}
                    item={{
                        title: item.tag,
                    }}
                    index={index}
                    onPress={() => onItemPress(item.tag)}
                />
            );
        },
        [selectedCount, onItemPress, colors]
    );

    const data = useMemo(() => {
        return tagsToShow;
    }, [tagsToShow, selectedCount]);

    return (
        <View className="flex-col gap-2 px-4">
            <View className="border-border/25 dark:border-border/80 flex-row items-center rounded-md border bg-card px-4 py-3">
                <Text className="text-foreground">#</Text>
                <TextInput
                    className="flex-1 px-1 text-foreground"
                    value={search}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={false}
                    onChangeText={setSearch}
                    placeholder="tags"
                />

                <Button
                    size="sm"
                    variant={tagsToShow.length === 0 ? 'primary' : 'secondary'}
                    disabled={search.length === 0}
                    onPress={addTagManually}>
                    <Text>Add</Text>
                </Button>
            </View>

            <FlatList data={data} variant="insets" keyExtractor={keyExtractor} renderItem={renderItem} />
        </View>
    );
}

/**
 * This function gets the tags that should be shown to the user;
 * to do that it looks at what tags the user has used, what tags
 * the user has interacted with, and what tags are popular in their
 * network.
 */
function getTagsToShow(ndk: NDK, user: NDKUser, follows: Hexpubkey[], search?: string): TagEntry[] {
    const tagsFromUser = getTagsUsedBy(ndk, [user.pubkey], 8, search);

    const tagsFromNetwork = getTagsUsedBy(ndk, follows, 20, search);

    const tagsToReturn: TagEntry[] = tagsFromUser;
    const idsFromUser = new Set(tagsFromUser.map((tag) => tag.id));

    tagsFromNetwork.forEach((tag) => {
        if (idsFromUser.has(tag.id)) {
            // find the tag in the array and add the count
            const tagFromUser = tagsToReturn.find((t) => t.id === tag.id);
            if (tagFromUser) tagFromUser.count += tag.count;
        } else {
            tagsToReturn.push(tag);
        }
    });

    return tagsToReturn;
}

/**
 * This function gets the tags that should be shown to the user;
 * to do that it looks at what tags the user has used, what tags
 * the user has interacted with, and what tags are popular in their
 * network.
 *
 * @param ndk
 * @param pubkeys
 * @param top The number of most popular tags to return
 * @returns
 */
function getTagsUsedBy(ndk: NDK, pubkeys: Hexpubkey[], top: number, search?: string): TagEntry[] {
    let postsByUser = getPostsByUser(ndk, pubkeys);

    if (search) {
        const lowerCaseSearch = search.toLowerCase();
        console.log('search', postsByUser.length, search, lowerCaseSearch);
        postsByUser = postsByUser.filter((post) => post.getMatchingTags('t').some((tag) => tag[1].toLowerCase().includes(lowerCaseSearch)));
        console.log('postsByUser', postsByUser.length);
    }

    // This tracks the different variations of how a tag is used, so #olas and #Olas would go into the same entry
    // and each variation would have a count, at the end we count which variation is most frequently used
    // and we return that one as the tag.
    const tagVariations = new Map<string, Record<string, number>>();

    // This counts how many tags a tag is tagged in total, regardless of the variation
    const tagCount = new Map<string, number>();

    postsByUser.forEach((post) => {
        post.getMatchingTags('t').forEach((tag) => {
            const tagName = tag[1] as string;
            const id = tagName.toLowerCase();
            const currentEntry = tagVariations.get(id) ?? {};
            currentEntry[tagName] ??= 0;
            currentEntry[tagName]++;
            tagVariations.set(id, currentEntry);

            const currentCount = tagCount.get(id) ?? 0;
            tagCount.set(id, currentCount + 1);
        });
    });

    // get the top tags
    const topTags = Array.from(tagCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, top)
        .map(([tag, count]) => ({ id: tag.toLowerCase(), tag, count }));

    // get the most common tag variation of each top tag and add it to the topTags array
    topTags.forEach((tag) => {
        const variations = tagVariations.get(tag.id);
        if (variations) {
            const mostCommonVariation = Object.entries(variations).sort((a, b) => b[1] - a[1])[0];
            tag.tag = mostCommonVariation[0];
        }
    });

    return topTags;
}
