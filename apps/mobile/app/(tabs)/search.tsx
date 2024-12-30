import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useStore } from "zustand";
import { Text } from "@/components/nativewindui/Text";
import { Dimensions, View } from "react-native";
import { Pressable, TextInput } from "react-native-gesture-handler";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Search } from "lucide-react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NDKKind, NDKRelaySet, NDKSubscriptionCacheUsage, NDKSubscriptionOptions, useNDK, useSubscribe } from "@nostr-dev-kit/ndk-mobile";
import { MasonryFlashList } from "@shopify/flash-list";
import { EventMediaGridContainer } from "@/components/media/event";
import { router, useLocalSearchParams } from "expo-router";
import { activeEventStore } from "../stores";

const inputAtom = atom("#photography");

const relays = ['wss://relay.olas.app'] as const;

const opts: NDKSubscriptionOptions = { cacheUsage: NDKSubscriptionCacheUsage.PARALLEL, closeOnEose: true } as const;

export default function SearchScreen() {
    const inset = useSafeAreaInsets();  
    const [ input, setInput ] = useAtom(inputAtom);

    const hashtagFromQuery = useLocalSearchParams().q;
    if (hashtagFromQuery) {
        setInput(hashtagFromQuery as string);
    }

    const filters = useMemo(() => ([
        { kinds: [NDKKind.Image, NDKKind.HorizontalVideo, NDKKind.VerticalVideo], "#t": [input] },
        { kinds: [NDKKind.Text], "#t": [input] },
    ]), [input]);

    const { events } = useSubscribe({ filters, opts, relays });
        
    const onSearch = useCallback((value) => {
        setInput(value.replace("#", "").trim());
    }, []);

    const setActiveEvent = useStore(activeEventStore, (state) => state.setActiveEvent);

    return (
        <KeyboardAvoidingView style={{ paddingTop: inset.top}} className="bg-card flex-1">
            <View className="border-b border-border">
                <Input onSearch={onSearch} />
            </View>

            <View style={{ flex: 1 }}>
                <MasonryFlashList
                    data={events}
                    numColumns={3}
                    estimatedItemSize={100}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{paddingBottom:60}}
                    renderItem={({ item, index }) => (
                        <EventMediaGridContainer
                            event={item}
                            index={index}
                            onPress={() => {
                                setActiveEvent(item);
                                router.push('/view');
                            }} />
                    )}
                />
            </View>
            
        </KeyboardAvoidingView>
    )
}

function Input({ onSearch }: { onSearch: (input: string) => void }) {
    const input = useAtomValue(inputAtom);
    const [value, setValue] = useState<string>(input);
    const { colors } = useColorScheme();
    
    return (
        <View className="flex-row items-center justify-center bg-card p-6 rounded-lg">
            <TextInput
                value={value}
                onChangeText={(text) => {
                    if (text.trim().length === 0) text = '#';
                    setValue(text.trim());
                }}
                style={{ flex: 1 }}
                className="text-xl font-bold"
            />

            <Pressable
                onPress={() => {
                    onSearch(value);
                }}
            >
                <Search size={24} color={colors.foreground} />
            </Pressable>
        </View>
    )
}