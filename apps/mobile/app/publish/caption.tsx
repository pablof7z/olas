import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useAtom } from 'jotai';
import { metadataAtom, PostMetadata } from '@/components/NewPost/store';
import { generateHashtags } from '@nostr-dev-kit/ndk-mobile';

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

    const setCaption = useCallback((caption: string) => {
        const tags = modifyTagsFromCaptionChange(metadata?.tags??[], metadata?.caption??'', caption);
        setMetadata({ caption, tags });
    }, [metadata, setMetadata]);

    const onPress = useCallback(() => {
        setCaption(description);
        router.back();
    }, [description, setCaption]);

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
                value={description}
                onChangeText={setDescription}
                multiline
            />
        </>
    );
}
