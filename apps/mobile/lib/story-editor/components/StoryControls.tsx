import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CloseButton from './CloseButton';
import { EdgeInsets } from 'react-native-safe-area-context';

interface StoryControlsProps {
    insets: EdgeInsets;
    onClose: () => void;
    onAddText: () => void;
    onOpenStickers: () => void;
    onDeleteSelected: () => void;
    onPreview: () => void;
    onShare: () => void;
    isUploading: boolean;
    selectedStickerId: string | null;
    showPreviewButton?: boolean;
}

export default function StoryControls({
    insets,
    onClose,
    onAddText,
    onOpenStickers,
    onDeleteSelected,
    onPreview,
    onShare,
    isUploading,
    selectedStickerId,
    showPreviewButton,
}: StoryControlsProps) {
    return (
        <>
            <View style={[styles.header]}>
                <CloseButton onPress={onClose} />
                <TouchableOpacity style={[styles.button, styles.textButton]} testID="add-text-button" onPress={onAddText}>
                    <Ionicons name="text" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onOpenStickers} style={[styles.button, styles.stickersButton]} testID="add-stickers-button">
                    <Ionicons name="pricetag" size={20} color="white" />
                </TouchableOpacity>
                {selectedStickerId && (
                    <TouchableOpacity onPress={onDeleteSelected} style={[styles.button, styles.deleteButton]} testID="delete-button">
                        <Ionicons name="trash" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
                {showPreviewButton && (
                    <TouchableOpacity style={styles.previewButton} testID="preview-button" onPress={onPreview} disabled={isUploading}>
                        <Ionicons name="eye" size={40} color={'white'} />
                    </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                {isUploading ? (
                    <ActivityIndicator size="large" color="white" />
                ) : (
                    <TouchableOpacity style={styles.shareButton} testID="share-button" onPress={onShare} disabled={isUploading}>
                        <Ionicons
                            name={isUploading ? 'hourglass' : 'arrow-forward-circle'}
                            size={60}
                            color={isUploading ? 'gray' : 'white'}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 2,
    },
    button: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 40,
    },
    textButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickersButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteButton: {
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        zIndex: 2,
    },
    previewButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
