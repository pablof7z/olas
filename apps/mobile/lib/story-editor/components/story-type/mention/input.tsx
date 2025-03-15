import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import MentionSuggestions from '@/lib/comments/components/mention-suggestions';
import { FlashList } from '@shopify/flash-list';

interface MentionStickerInputProps {
    onStickerAdded: () => void;
    addMentionSticker: (profile: NDKUserProfile) => string;
}

export default function MentionStickerInput({ onStickerAdded, addMentionSticker }: MentionStickerInputProps) {
    const [searchQuery, setSearchQuery] = useState('@');
    const [loading, setLoading] = useState(false);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        setLoading(true);
        // MentionSuggestions handles its own data fetching
        setLoading(false);
    };

    const selectUser = (profile: NDKUserProfile) => {
        addMentionSticker(profile);
        onStickerAdded();
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="at" size={20} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="@username"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoFocus
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 1 && (
                        <TouchableOpacity onPress={() => handleSearch('@')}>
                            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={{ flex: 1, paddingHorizontal: 16 }}>
                {loading ? (
                    <ActivityIndicator color="white" style={styles.loader} />
                ) : (
                    <MentionSuggestions
                        query={searchQuery}
                        onPress={selectUser}
                        FlashListComponent={FlashList}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        padding: 4,
    },
    loader: {
        marginTop: 20,
    },
}); 