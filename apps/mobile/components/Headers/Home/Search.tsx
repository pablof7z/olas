import { useCallback, useEffect, useState, useRef } from "react";
import { searchQueryAtom, useSearchQuery } from "./store";
import { TextInput, View } from "react-native";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { searchInputRefAtom } from "@/components/FeedType/store";
import { NDKUser, useNDK } from "@nostr-dev-kit/ndk-mobile";
import { router } from "expo-router";

export default function SearchInput() {
    const searchQuery = useAtomValue(searchQueryAtom);
    const setSearchQuery = useSearchQuery();
    const [input, setInput] = useState(searchQuery);
    const setSearchInputRef = useSetAtom(searchInputRefAtom);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        setInput(searchQuery);
    }, [searchQuery]);

    // useEffect(() => {
    //     if (feedType.kind === 'search' && feedType.value && feedType.value !== knownLastSearchFeed.current && !isSavedSearch) {
    //         setInput(feedType.value);
    //         knownLastSearchFeed.current = feedType.value;
    //     }
    // }, [feedType.kind, feedType.value, input, setInput, isSavedSearch]);

    useEffect(() => {
        setSearchInputRef(inputRef);
    }, []);

    const { ndk } = useNDK();

    const search = useCallback(async (input: string) => {
        if (input.startsWith('npub1')) {
            try {
                const user = new NDKUser({npub: input});
                router.push(`/profile?pubkey=${user.pubkey}`);
                return;
            } catch {}
        }
        
        if (input.match(/@/)) {
            const user = await ndk.getUserFromNip05(input);
            if (user) {
                router.push(`/profile?pubkey=${user.pubkey}`);
                return;
            }
        }
        
        console.log('setting search query', input);
        setSearchQuery(input.trim());
    }, [setSearchQuery])

    const handleInputChange = useCallback((text: string) => {
        if (text.startsWith('@')) {
            // find usernames that match the input
            // cacheAdapter.db.
            
        }
        
        setInput(text);
    }, [input, setInput]);

    return (
        <View className="flex-1 flex-row gap-2">
            <TextInput
                ref={inputRef}
                placeholder="Search"
                onChangeText={handleInputChange}
                value={input}
                autoCapitalize="none"
                autoComplete="off"
                className="text-xl font-semibold text-foreground"
                autoCorrect={false}
                onSubmitEditing={() => search(input)}
            />

            {/* <Button variant="plain" onPress={() => setSearchQuery(input)}>
                <Search size={24} color={colors.foreground} />  
            </Button> */}
        </View>
    )
}


