import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { View } from 'react-native';
import { Pressable, TextInput } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Search } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NDKKind, NDKSubscriptionCacheUsage, NDKSubscriptionOptions, useNDK, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import { MasonryFlashList } from '@shopify/flash-list';
import { EventMediaGridContainer } from '@/components/media/event';
import { router, useLocalSearchParams } from 'expo-router';
import { usePostBottomSheet } from '@/hooks/post-bottom-sheet';
import { activeEventAtom } from '@/stores/event';

const inputAtom = atom('#photography');

const relays = ['wss://relay.olas.app'] as const;

export default function SearchScreen() {
    const inset = useSafeAreaInsets();
    const [input, setInput] = useAtom(inputAtom);

    const hashtagFromQuery = useLocalSearchParams().q;

    useEffect(() => {
        console.log('hashtagFromQuery', hashtagFromQuery);
        if (hashtagFromQuery && input !== hashtagFromQuery) {
            setInput(hashtagFromQuery as string);
        }
    }, [hashtagFromQuery, setInput]);

    const { events } = useSubscribe([
        { kinds: [NDKKind.Image, NDKKind.HorizontalVideo, NDKKind.VerticalVideo], '#t': [input] },
        { kinds: [NDKKind.Text], '#t': [input] }
    ], { cacheUsage: NDKSubscriptionCacheUsage.PARALLEL, closeOnEose: true, relays: [...relays] }, [ input ]);

    const onSearch = useCallback((value) => {
        setInput(value.replace('#', '').trim());
    }, []);

    const setActiveEvent = useSetAtom(activeEventAtom);
    const openPostBottomSheet = usePostBottomSheet();

    return (
        <KeyboardAvoidingView style={{ paddingTop: inset.top }} className="flex-1 bg-card">
            <View className="border-b border-border">
                <Input onSearch={onSearch} />
            </View>

            <View style={{ flex: 1 }}>
                <MasonryFlashList
                    data={events}
                    numColumns={3}
                    estimatedItemSize={100}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 60 }}
                    renderItem={({ item, index }) => (
                        <EventMediaGridContainer
                            event={item}
                            index={index}
                            onPress={() => {
                                setActiveEvent(item);
                                router.push('/view');
                            }}
                            onLongPress={() => openPostBottomSheet(item)}
                        />
                    )}
                />
            </View>
        </KeyboardAvoidingView>
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
