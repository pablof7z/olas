import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Button } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { publishStore } from '../stores/publish';
import { useStore } from 'zustand';

export default function Caption() {
    const { caption, setCaption } = useStore(publishStore);
    const [description, setDescription] = useState(caption ?? '');

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
                                setCaption(description);
                                router.back();
                            }}
                        />
                    ),
                }}
            />
            <TextInput
                className="p-4"
                placeholder="Write a caption or comment..."
                autoFocus
                value={description}
                onChangeText={setDescription}
                multiline
            />
        </>
    );
}
