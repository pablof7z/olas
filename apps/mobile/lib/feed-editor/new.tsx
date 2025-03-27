import { atom } from 'jotai';
import { useCallback, useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useFeedEditorStore } from './store';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import Tabs from '@/components/tabs';

const tabAtom = atom<string>('New');

export default function New() {
    const store = useFeedEditorStore();

    const [title, setTitle] = useState(store.title ?? '');
    const [description, setDescription] = useState(store.description ?? '');
    const [image, setImage] = useState(store.image ?? '');
    const [hashtags, setHashtags] = useState<string[]>(store.hashtags ?? []);
    const [pubkeys, setPubkeys] = useState<string[]>(store.pubkeys ?? []);
    const [encrypted, setEncrypted] = useState(store.encrypted ?? false);

    const save = useCallback(() => {
        store.save();
    }, [store]);

    return (
        <KeyboardAvoidingView style={styles.container}>
            <View style={styles.innerContainer}>
                <View style={styles.fieldContainer}>
                    <Text variant="caption1">Title</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Title"
                        style={styles.titleInput}
                        className="border border-border text-xl font-bold"
                    />
                </View>
            </View>

            <View style={styles.buttonContainer}>
                <Button size="lg" variant="primary" onPress={save}>
                    <Text>Save</Text>
                </Button>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    innerContainer: {
        flex: 1,
        flexDirection: 'column',
        gap: 10,
    },
    fieldContainer: {
        flexDirection: 'column',
        gap: 5,
    },
    titleInput: {
        borderRadius: 5,
        padding: 5,
    },
    buttonContainer: {
        marginTop: 10,
    },
});
