import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Text } from '@/components/nativewindui/Text';
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { metadataAtom } from '@/components/NewPost/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions, FlatList, TextInput, View } from 'react-native';
import { getPostsByUser } from '@/utils/db';
import NDK, { type Hexpubkey, NDKUser, useNDK, useNDKCurrentUser, useFollows, generateHashtags } from '@nostr-dev-kit/ndk-mobile';
import { List, ListItem } from './nativewindui/List';
import { cn } from '@/lib/cn';
import { myFollows } from '@/utils/myfollows';
import { Button } from './nativewindui/Button';

export const mountTagSelectorAtom = atom<boolean, [boolean], null>(false, (get, set, value) =>
    set(mountTagSelectorAtom, value)
);

type TagEntry = {
    // This is the tag as we match for internally
    id: string;

    // This is the tag as we display to the user
    tag: string;

    // This is the count of how many times this tag has been used
    count: number;
}

type TagSelectorSheetRefAtomType = RefObject<BottomSheetModal> | null;

export const tagSelectorBottomSheetRefAtom = atom<TagSelectorSheetRefAtomType, [TagSelectorSheetRefAtomType], null>(null, (get, set, value) =>
    set(tagSelectorBottomSheetRefAtom, value)
);

export function TagSelectorBottomSheet() {
    const ref = useSheetRef();
    const setBottomSheetRef = useSetAtom(tagSelectorBottomSheetRefAtom);
    const inset = useSafeAreaInsets();
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const selectedTags = useRef<Set<string>>(new Set());
    const [selectedCount, setSelectedCount] = useState(0);

    useEffect(() => {
        selectedTags.current.clear();
        for (const tag of metadata.tags ?? []) {
            selectedTags.current.add(tag);
        }
        setSelectedCount(selectedTags.current.size);
    }, [metadata?.tags?.length])

    useEffect(() => {
        setBottomSheetRef(ref);
    }, [ref, setBottomSheetRef]);

    const updateCaption = useCallback(() => {
        const currentCaptionTags = generateHashtags(metadata?.caption ?? "");

        // see if the caption has tags we don't have, if it does, let's remove them 
        const tagsToRemove = currentCaptionTags.filter((tag) => !selectedTags.current.has(tag));
        const newCaption = (metadata?.caption ?? "")
            .replace(/#(\w+)/g, (match, tag) => {
                if (tagsToRemove.includes(tag)) return '';
                return match;
            })
            .trim();
        setMetadata({ ...metadata, caption: newCaption });
    }, [metadata, setMetadata]);

    return (
        <Sheet ref={ref} onDismiss={updateCaption}>
            <BottomSheetView style={{ paddingBottom: inset.bottom, height: Dimensions.get('window').height * 0.8 }}>
                <TagSelector />
            </BottomSheetView>
        </Sheet>
    );
}

export function TagSelector({ onSelected }: { onSelected?: (tag: string) => void }) {
    const inset = useSafeAreaInsets();
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const follows = useFollows();
    const [search, setSearch] = useState('');
    const selectedTags = useRef<Set<string>>(new Set());
    const [selectedCount, setSelectedCount] = useState(0);

    const mountTagSelector = useAtomValue(mountTagSelectorAtom);

    useEffect(() => {
        selectedTags.current.clear();
        for (const tag of metadata.tags ?? []) {
            selectedTags.current.add(tag);
        }
        setSelectedCount(selectedTags.current.size);
    }, [metadata?.tags?.length])

    const tagsToShow = useMemo(() => {
        if (!ndk || !currentUser || !mountTagSelector) return [];

        const followsToUse = follows?.length > 5 ? follows : myFollows;
        const alphanumSearch = search.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const result = getTagsToShow(ndk, currentUser, followsToUse, alphanumSearch);

        // if we have a search, let's sort by the fact that the tag actually matches, if it doesn't match, it should be lower
        if (alphanumSearch) {
            result.sort((a, b) => {
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

    const setTagsInMetadata = useCallback((tags: string[]) => {
        setMetadata({ ...metadata, tags });
    }, [metadata, setMetadata]);

    const addTagManually = useCallback(() => {
        if (!search) return;
        if (onSelected) {
            onSelected(search);
            return;
        }

        selectedTags.current.add(search);
        setTagsInMetadata(Array.from(selectedTags.current));
        setSelectedCount(selectedTags.current.size);
        setSearch('');
    }, [search, setSearch, setTagsInMetadata]);

    const onItemPress = useCallback((tag: string) => {
        if (onSelected) {
            onSelected(tag);
            return;
        }
        
        if (selectedTags.current.has(tag)) selectedTags.current.delete(tag);
        else selectedTags.current.add(tag);
        setTagsInMetadata(Array.from(selectedTags.current));
        setSelectedCount(selectedTags.current.size);
        setSearch('');
    }, [setTagsInMetadata, setSelectedCount, setSearch, onSelected]);

    const keyExtractor = (item: TagEntry) => item.tag;
    const renderItem = useCallback(({ item, index }: { item: TagEntry, index: number, target }) => {
        const isSelected = selectedTags.current.has(item.tag);
        return (
            <ListItem
                className={cn(
                    'ios:pl-0 pl-2',
                    index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t',
                )}
                titleClassName={cn(
                    isSelected && '!text-primary !font-bold',
                )}
                leftView={<Text className={cn("text-muted-foreground pl-4", isSelected && '!text-primary !font-bold')}>#</Text>}
                item={{
                    title: item.tag,
                }}
                index={index}
                onPress={() => onItemPress(item.tag)}
            />
        );
    }, [selectedCount, onItemPress]);

    const data = useMemo(() => {
        return tagsToShow;
    }, [tagsToShow, selectedCount, renderItem, onItemPress]);

    return (
        <View className="px-4 flex-col gap-2">
            <View className="flex-row items-center bg-card border border-border/25 dark:border-border/80 rounded-md px-4 py-3">
                <Text className="text-foreground">#</Text>
                <TextInput
                    className="text-foreground flex-1 px-1"
                    value={search}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={false}
                    onChangeText={setSearch}
                    placeholder="tags"
                />

                <Button
                    size="sm"
                    variant={tagsToShow.length === 0 ? 'primary' : 'secondary' }
                    disabled={search.length === 0}
                    onPress={addTagManually}
                >
                    <Text>Add</Text>
                </Button>
            </View>

            <FlatList
                data={data}
                variant="insets"
                keyExtractor={keyExtractor}
                renderItem={renderItem}
            />
        </View>
    );
}


/**
 * This function gets the tags that should be shown to the user;
 * to do that it looks at what tags the user has used, what tags
 * the user has interacted with, and what tags are popular in their
 * network.
 */
function getTagsToShow(ndk: NDK, user: NDKUser, follows: Hexpubkey[], search?: string): Array<TagEntry> {
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
    
    // return tagsFromUser;
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
function getTagsUsedBy(ndk: NDK, pubkeys: Hexpubkey[], top: number, search?: string): Array<TagEntry> {
    let postsByUser = getPostsByUser(ndk, pubkeys);

    if (search) {
        const lowerCaseSearch = search.toLowerCase();
        console.log('search', postsByUser.length, search, lowerCaseSearch);
        postsByUser = postsByUser.filter((post) => post.getMatchingTags("t").some((tag) => tag[1].toLowerCase().includes(lowerCaseSearch)));
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
        const mostCommonVariation = Object.entries(variations).sort((a, b) => b[1] - a[1])[0];
        tag.tag = mostCommonVariation[0];
    });

    return topTags;
}