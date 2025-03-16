import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useStickerStore } from '../../../store';
import { NDKStoryStickerType } from '../../../types';

interface NostrFilterStickerInputProps {
    onStickerAdded: () => void;
}

export default function NostrFilterStickerInput({ onStickerAdded }: NostrFilterStickerInputProps) {
    const [filterText, setFilterText] = useState('');
    const { colors } = useColorScheme();
    const { addSticker } = useStickerStore();

    const handleFilterTextChange = (text: string) => {
        setFilterText(text);
    };

    // Validates if the input is a valid NDKFilter
    const isValidNDKFilter = useCallback((text: string): boolean => {
        try {
            const json = JSON.parse(text);
            
            // Check if it follows the NDKFilter structure
            if (typeof json !== 'object' || json === null) {
                return false;
            }

            // Check for valid NDKFilter properties
            const validProperties = [
                'ids', 'kinds', 'authors', 'since',
                'until', 'limit', 'search'
            ];

            // Any additional properties should be tag properties
            for (const key of Object.keys(json)) {
                if (!validProperties.includes(key) && !/^#[a-zA-Z]/.test(key)) {
                    // If not a valid property and not a tag property (#x)
                    return false;
                }

                // Validate array properties
                if (['ids', 'kinds', 'authors'].includes(key)) {
                    if (!Array.isArray(json[key])) {
                        return false;
                    }
                }

                // Validate number properties
                if (['since', 'until', 'limit'].includes(key)) {
                    if (typeof json[key] !== 'number') {
                        return false;
                    }
                }

                // Validate tag properties
                if (key.startsWith('#')) {
                    if (!Array.isArray(json[key])) {
                        return false;
                    }
                    
                    // All values in tag arrays must be strings
                    if (json[key].some((item: any) => typeof item !== 'string')) {
                        return false;
                    }
                }

                // Validate search
                if (key === 'search' && typeof json[key] !== 'string') {
                    return false;
                }
            }

            return true;
        } catch (e) {
            return false;
        }
    }, []);

    const handleAddFilterSticker = () => {
        if (!filterText.trim()) {
            return;
        }

        if (isValidNDKFilter(filterText)) {
            addSticker({
                type: NDKStoryStickerType.NostrFilter,
                content: filterText,
                styleId: 'default'
            });
            onStickerAdded();
        } else {
            Alert.alert(
                "Invalid Filter",
                "The text doesn't conform to a valid NDKFilter format. Please check and try again.",
                [{ text: "OK" }]
            );
        }
    };

    return (
        <View style={styles.filterInputContainer}>
            <Text style={styles.eventInputLabel}>Enter Nostr Filter (JSON format):</Text>
            <TextInput
                style={[styles.filterInput, { color: colors.foreground }]}
                placeholder='{"kinds":[1],"limit":10}'
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={filterText}
                onChangeText={handleFilterTextChange}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />
            <TouchableOpacity 
                style={[
                    styles.addEventButton,
                    { opacity: filterText.trim() ? 1 : 0.5 }
                ]}
                onPress={handleAddFilterSticker}
                disabled={!filterText.trim()}
            >
                <Text style={styles.addEventButtonText}>Done</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    filterInputContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    eventInputLabel: {
        color: 'white',
        fontSize: 16,
        marginBottom: 12,
    },
    filterInput: {
        backgroundColor: 'rgba(50, 50, 50, 0.4)',
        borderRadius: 10,
        padding: 12,
        color: 'white',
        fontSize: 16,
        marginBottom: 20,
        minHeight: 150,
        fontFamily: 'monospace',
    },
    addEventButton: {
        backgroundColor: '#0ea5e9', // blue
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    addEventButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
}); 