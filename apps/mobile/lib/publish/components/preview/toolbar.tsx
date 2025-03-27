import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditorStore } from '@/lib/publish/store/editor';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

export default function PreviewToolbar() {
    return (
        <View style={styles.container}>
            <SystemMediaSelectorButton />
            <SelectionModeToggle />
        </View>
    );
}

function SystemMediaSelectorButton() {
    const addMedia = useEditorStore((state) => state.addMedia);

    const handleSelectMedia = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsMultipleSelection: false,
                quality: 1,
                exif: true,
            });

            if (!result.canceled && result.assets.length > 0) {
                const selectedAsset = result.assets[0];

                await addMedia(selectedAsset.uri, selectedAsset.type as 'image' | 'video');

                // Navigate to edit screen
                router.push('/publish/post/edit');
            }
        } catch (error) {
            console.error('Error selecting media:', error);
        }
    };

    return (
        <Pressable style={styles.button} onPress={handleSelectMedia}>
            <Ionicons name="images-outline" size={24} color="white" />
        </Pressable>
    );
}

function SelectionModeToggle() {
    const { isMultipleSelectionMode, toggleSelectionMode } = useEditorStore();

    return (
        <Pressable style={styles.button} onPress={toggleSelectionMode}>
            <Ionicons name={isMultipleSelectionMode ? 'grid' : 'square-outline'} size={24} color="white" />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    button: {
        padding: 10,
        borderRadius: 5,
    },
});
