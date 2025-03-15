import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '@/lib/story-editor/context/StickerContext';

interface NostrFilterStickerViewProps {
    sticker: Sticker;
}

export default function NostrFilterStickerView({ sticker }: NostrFilterStickerViewProps) {
    // Attempt to parse the filter for display
    let filterSummary = 'Nostr Filter';
    try {
        const filter = JSON.parse(sticker.content);
        const parts = [];
        
        if (filter.kinds && filter.kinds.length) {
            parts.push(`Kinds: ${filter.kinds.join(', ')}`);
        }
        
        if (filter.limit) {
            parts.push(`Limit: ${filter.limit}`);
        }
        
        if (parts.length) {
            filterSummary = parts.join(' • ');
        }
    } catch (e) {
        // Keep default text if parsing fails
    }
    
    return (
        <View style={styles.container}>
            <Ionicons name="filter" size={18} color="white" style={styles.icon} />
            <Text style={styles.text}>{filterSummary}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 16,
    },
    icon: {
        marginRight: 6,
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 