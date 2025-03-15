import { View } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { NDKCacheAdapterSqlite, useNDK, searchProfiles, NDKUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { FlashList } from "@shopify/flash-list";
import AvatarAndName from "@/components/ui/user/avatar-name";
import { useColorScheme } from "@/lib/useColorScheme";

interface MentionSuggestionsProps {
    query: string;
    onPress: (profile: NDKUserProfile) => void;
    FlashListComponent?: typeof FlashList;
}

export default function MentionSuggestions({ query, onPress, FlashListComponent = FlashList }: MentionSuggestionsProps) {
    const { ndk } = useNDK();
    const [profiles, setProfiles] = useState<NDKUserProfile[]>([]);

    useEffect(() => {
        if (!ndk) return;
        const cacheAdapter = ndk.cacheAdapter as NDKCacheAdapterSqlite;
        const profiles = searchProfiles(cacheAdapter, query.slice(1));
        setProfiles(profiles);
    }, [query]);
    
    return (
        <View style={{ flex: 1, width: '100%' }}>
            <FlashListComponent
                data={profiles}
                renderItem={({ item }) => <SuggestionItem item={item} onPress={onPress} />}
            />
        </View>
    )
}


function SuggestionItem({ item, onPress }: { item: NDKUserProfile, onPress: (profile: NDKUserProfile) => void }) {
    const { colors } = useColorScheme();
    const handlePress = useCallback(() => {
        onPress(item);
    }, [item?.pubkey, onPress]);

    if (!item.pubkey) return null;
    
    return <AvatarAndName onPress={handlePress} pubkey={String(item.pubkey)} userProfile={item} imageSize={24} nameStyle={{ fontSize: 12, fontWeight: 'normal', color: colors.foreground }} />
}