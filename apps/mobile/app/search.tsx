import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { View, StyleSheet } from 'react-native';
import { Pressable, TextInput } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NDKKind, NDKSubscriptionCacheUsage, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Feed from '@/components/Feed';

const inputAtom = atom('#photography');

const relays = ['wss://relay.olas.app'] as const;

export default function SearchScreen() {
    const [input, setInput] = useAtom(inputAtom);

    const hashtagFromQuery = useLocalSearchParams().q;

    const onSearch = useCallback((value) => {
        setInput(value.replace('#', '').trim());
    }, []);

    useEffect(() => {
        if (hashtagFromQuery && input !== hashtagFromQuery) {
            onSearch(hashtagFromQuery as string);
        }
    }, [hashtagFromQuery, setInput]);

    const filters = useMemo(() => {
        return [{ kinds: [NDKKind.Image, NDKKind.VerticalVideo], '#t': [input.trim().replace('#', '')] }];
    }, [input]);

    const insets = useSafeAreaInsets();
    const containerStyle = useMemo(() => {
        return {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
        };
    }, [insets]);
    const { colors } = useColorScheme();

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <KeyboardAvoidingView className="flex-1 bg-card" style={containerStyle}>
                <View style={styles.headerContainer}>
                    <Pressable onPress={() => router.replace('/(home)')}>
                        <ArrowLeft size={24} color={colors.foreground} />
                    </Pressable>
                    <View className="flex-1 border-b border-border">
                        <Input onSearch={onSearch} />
                    </View>
                </View>

                <View style={{ flex: 1 }}>
                    <Feed filters={filters} filterKey={input} numColumns={3} />
                </View>
            </KeyboardAvoidingView>
        </>
    );
}

function Input({ onSearch }: { onSearch: (input: string) => void }) {
    const input = useAtomValue(inputAtom); // Get the atom value
    const [value, setValue] = useState<string>(input); // Local state for input value
    const { colors } = useColorScheme();

    // Sync with atom value when it changes
    useEffect(() => {
        setValue(input);
    }, [input]);

    // Trigger search action
    const handleSearch = useCallback(() => {
        onSearch(value);
    }, [value, onSearch]);

    return (
        <View className="flex-row items-center justify-center rounded-lg bg-card p-6">
            <TextInput
                value={value}
                onChangeText={(text) => {
                    setValue(text.trim() || '#');
                }}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                style={{
                    flex: 1,
                    color: colors.foreground,
                }}
                className="text-xl font-bold"
            />

            <Pressable onPress={handleSearch}>
                <Search size={24} color={colors.foreground} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
});
