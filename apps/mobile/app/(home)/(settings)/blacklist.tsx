import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/nativewindui/Button';
import { LargeTitleHeader } from '@/components/nativewindui/LargeTitleHeader';
import { List, ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import { TextField } from '@/components/nativewindui/TextField';
import { useAppSettingsStore } from '@/stores/app';

export default function BlacklistScreen() {
    const [newWord, setNewWord] = useState('');
    const blacklistedWords = useAppSettingsStore((s) => s.blacklistedWords);
    const setBlacklistedWords = (words: string[]) => useAppSettingsStore.setState({ blacklistedWords: words });

    const addWord = () => {
        if (newWord.trim() && !blacklistedWords.includes(newWord.trim())) {
            setBlacklistedWords([...blacklistedWords, newWord.trim()]);
            setNewWord('');
        }
    };

    const removeWord = (word: string) => {
        setBlacklistedWords(blacklistedWords.filter((w) => w !== word));
    };

    return (
        <>
            <LargeTitleHeader title="Content Filters" />
            <View className="p-4">
                <TextField
                    value={newWord}
                    onChangeText={setNewWord}
                    placeholder="Add word to blacklist"
                    onSubmitEditing={addWord}
                    returnKeyType="done"
                />
                <Button className="mt-2" onPress={addWord}>
                    Add Word
                </Button>
            </View>
            <List
                data={blacklistedWords}
                estimatedItemSize={50}
                renderItem={({ item, index }) => (
                    <ListItem
                        item={{
                            title: item,
                        }}
                        rightView={
                            <Button variant="destructive" size="sm" onPress={() => removeWord(item)}>
                                Remove
                            </Button>
                        }
                    />
                )}
            />
        </>
    );
}
