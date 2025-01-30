import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, NativeSyntheticEvent, TextInputKeyPressEventData, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useAtom, useAtomValue } from 'jotai';
import { metadataAtom, PostMetadata } from '@/components/NewPost/store';
import { generateHashtags } from '@nostr-dev-kit/ndk-mobile';
import { TagSelector, tagSelectorBottomSheetRefAtom } from '@/components/TagSelectorBottomSheet';

function modifyTagsFromCaptionChange(
    tags: string[],
    previousCaption: string,
    newCaption: string
) {
    const tagSet = new Set(tags);
    const previousTags = generateHashtags(previousCaption);

    // remove tags that were in the previous caption but not in the new caption
    previousTags.forEach(tag => tagSet.delete(tag));

    // add tags from the new caption
    const newTags = generateHashtags(newCaption);
    newTags.forEach(tag => tagSet.add(tag));

    console.log('tags', { previousTags, newTags });

    return Array.from(tagSet);
}

export default function Caption() {
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const [description, setDescription] = useState(metadata?.caption ?? '');
    const [showTagSelector, setShowTagSelector] = useState(false);

    const setCaption = useCallback((caption: string) => {
        const tags = modifyTagsFromCaptionChange(metadata?.tags??[], metadata?.caption??'', caption);
        setMetadata({ ...metadata, caption, tags });
    }, [metadata, setMetadata]);

    const onPress = useCallback(() => {
        setCaption(description);
        router.back();
    }, [description, setCaption]);

    const onKeyPress = useCallback((e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (e.nativeEvent.key === '#') {
            e.preventDefault();
            setShowTagSelector(true);
        }
    }, [onPress]);

    const onTagSelected = useCallback((tag: string) => {
        const newDescription = [description];
        newDescription.push(...tag.split(' ').map(t => t.trim().replace(/[^a-zA-Z0-9]/g, '')).map(t => `#${t}`));
        setDescription(newDescription.join(' '));
        setShowTagSelector(false);
    }, [description, setDescription]);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Caption',
                    headerRight: () => (
                        <Button
                            title="OK"
                            onPress={onPress}
                        />
                    ),
                }}
            />
            <TextInput
                className="p-4 text-lg text-foreground"
                placeholder="Write a caption or comment..."
                autoFocus
                style={styles.input}
                value={description}
                onKeyPress={onKeyPress}
                onChangeText={setDescription}
                multiline
            />

            <TagSelector onSelected={onTagSelected} />
        </>
    );
}

const styles = StyleSheet.create({
    input: {
        minHeight: 200,
    },
});
