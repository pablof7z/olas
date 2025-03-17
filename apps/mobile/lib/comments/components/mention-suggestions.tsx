import { View, StyleSheet } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { NDKCacheAdapterSqlite, useNDK, searchProfiles, NDKUserProfile, NDKUser, useUserProfile, Hexpubkey } from "@nostr-dev-kit/ndk-mobile";
import { FlashList } from "@shopify/flash-list";
import AvatarAndName from "@/components/ui/user/avatar-name";
import { useColorScheme } from "@/lib/useColorScheme";
import { UserProfile } from "@/hooks/user-profile";

interface MentionSuggestionsProps {
    query: string;
    onPress: (pubkey: Hexpubkey, userProfile: NDKUserProfile) => void;
    FlashListComponent?: typeof FlashList;
}

export default function MentionSuggestions({ query, onPress, FlashListComponent = FlashList }: MentionSuggestionsProps) {
    const { ndk } = useNDK();
    const { colors } = useColorScheme();
    const [profiles, setProfiles] = useState<[Hexpubkey, NDKUserProfile][]>([]);

    useEffect(() => {
        if (!ndk) return;
        const cacheAdapter = ndk.cacheAdapter as NDKCacheAdapterSqlite;
        const rows = searchProfiles(cacheAdapter, query.slice(1));
        setProfiles(rows);
    }, [query]);
    
    const handleProfileSelect = useCallback((pubkey: Hexpubkey, profile: NDKUserProfile) => {
        onPress(pubkey, profile);
    }, [onPress]);
    
    return (
        <View style={styles.container}>
            <FlashListComponent
                data={profiles}
                estimatedItemSize={50}
                renderItem={({ item }) => <SuggestionItem item={item} onPress={handleProfileSelect} />}
                ItemSeparatorComponent={() => (
                    <View style={[styles.separator, { backgroundColor: colors.grey4 }]} />
                )}
                contentContainerStyle={styles.listContent}
            />
        </View>
    )
}


function SuggestionItem({ item, onPress }: { item: [Hexpubkey, NDKUserProfile], onPress: (pubkey: Hexpubkey, profile: NDKUserProfile) => void }) {
    const { colors } = useColorScheme();
    const handlePress = useCallback(() => {
        onPress(item[0], item[1]);
    }, [item, onPress]);
    
    const [pubkey, userProfile] = item;

    if (!pubkey) return null;
    
    return (
        <View style={styles.itemContainer}>
            <AvatarAndName 
                onPress={handlePress} 
                pubkey={pubkey} 
                userProfile={userProfile} 
                imageSize={28} 
                nameStyle={{ 
                    fontSize: 14, 
                    fontWeight: '500', 
                    color: colors.foreground 
                }}
                pressableStyle={styles.avatarNameContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    listContent: {
        paddingVertical: 4,
    },
    itemContainer: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    avatarNameContainer: {
        width: '100%',
    },
    separator: {
        height: 1,
        width: '94%',
        alignSelf: 'center',
    }
});