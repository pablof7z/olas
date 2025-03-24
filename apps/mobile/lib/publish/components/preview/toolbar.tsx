import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore } from '@/lib/publish/store/editor';

export default function PreviewToolbar() {
    return (
        <View style={styles.container}>
            <SystemMediaSelectorButton />
            <SelectionModeToggle />
        </View>
    );
}

function SystemMediaSelectorButton() {
    return (
        <Pressable style={styles.button}>
            <Ionicons name="image" size={24} color="white" />
        </Pressable>
    );
}

function SelectionModeToggle() {
    const { isMultipleSelectionMode, toggleSelectionMode } = useEditorStore();
    
    return (
        <Pressable style={styles.button} onPress={toggleSelectionMode}>
            <Ionicons 
                name={isMultipleSelectionMode ? "grid" : "square-outline"} 
                size={24} 
                color="white" 
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12
    },
    button: {
        padding: 10,
        borderRadius: 5,
    }
});