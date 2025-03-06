import { View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { useEffect, useState } from "react";
import { NDKCacheAdapterSqlite, useNDK, searchProfiles, NDKUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { FlashList } from "@shopify/flash-list";

export default function MentionSuggestions({ query, FlashListComponent = FlashList }: { query: string, FlashListComponent: typeof FlashList}) {
    const { ndk } = useNDK();
    const [profiles, setProfiles] = useState<NDKUserProfile[]>([]);

    useEffect(() => {
        if (!ndk) return;
        const cacheAdapter = ndk.cacheAdapter as NDKCacheAdapterSqlite;
        const profiles = searchProfiles(cacheAdapter, query.slice(1));
        setProfiles(profiles);
    }, [query]);
    
    return (
        <View style={{ flex: 1 }}>
            <Text>{query} {profiles.length}</Text>
            <FlashListComponent
                data={profiles}
                renderItem={({ item }) => <Text>{item.name}</Text>}
            />
            <Text>{query}</Text>
        </View>
    )
}