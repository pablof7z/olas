import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Button } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useAtom } from 'jotai';
import { metadataAtom } from '@/components/NewPost/store';

export default function Caption() {
    const [metadata, setMetadata] = useAtom(metadataAtom);
    const [description, setDescription] = useState(metadata?.caption ?? '');

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Caption',
                    headerRight: () => (
                        <Button
                            title="OK"
                            onPress={() => {
                                setMetadata({ ...metadata, caption: description });
                                router.back();
                            }}
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
