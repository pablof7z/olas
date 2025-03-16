import { View, StyleSheet } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { NDKCacheAdapterSqlite, useNDK, searchProfiles, NDKUserProfile, NDKUser } from "@nostr-dev-kit/ndk-mobile";
import { FlashList } from "@shopify/flash-list";
import AvatarAndName from "@/components/ui/user/avatar-name";
import { useColorScheme } from "@/lib/useColorScheme";

interface MentionSuggestionsProps {
    query: string;
    onPress: (user: NDKUser) => void;
    FlashListComponent?: typeof FlashList;
}

export default function MentionSuggestions({ query, onPress, FlashListComponent = FlashList }: MentionSuggestionsProps) {
    const { ndk } = useNDK();
    const { colors } = useColorScheme();
    const [profiles, setProfiles] = useState<NDKUserProfile[]>([]);

    useEffect(() => {
        if (!ndk) return;
        const cacheAdapter = ndk.cacheAdapter as NDKCacheAdapterSqlite;
        const profiles = searchProfiles(cacheAdapter, query.slice(1));
        setProfiles(profiles);
    }, [query]);
    
    const handleProfileSelect = useCallback((profile: NDKUserProfile) => {
        if (!ndk || !profile.pubkey) return;
        // Convert pubkey to string if it's a number
        const pubkeyStr = typeof profile.pubkey === 'number' ? String(profile.pubkey) : profile.pubkey;
        const user = ndk.getUser({ pubkey: pubkeyStr });
        
        // Create a new profile object without undefined values
        if (user.profile) {
            // Copy over profile data
            user.profile.name = profile.name;
            user.profile.displayName = profile.displayName;
            user.profile.image = profile.image || profile.picture;
            user.profile.banner = profile.banner;
            user.profile.about = profile.about;
            user.profile.nip05 = profile.nip05;
            user.profile.lud06 = profile.lud06;
            user.profile.lud16 = profile.lud16;
        }
        
        onPress(user);
    }, [ndk, onPress]);
    
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


function SuggestionItem({ item, onPress }: { item: NDKUserProfile, onPress: (profile: NDKUserProfile) => void }) {
    const { colors } = useColorScheme();
    const handlePress = useCallback(() => {
        onPress(item);
    }, [item?.pubkey, onPress]);

    if (!item.pubkey) return null;
    
    return (
        <View style={styles.itemContainer}>
            <AvatarAndName 
                onPress={handlePress} 
                pubkey={String(item.pubkey)} 
                userProfile={item} 
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