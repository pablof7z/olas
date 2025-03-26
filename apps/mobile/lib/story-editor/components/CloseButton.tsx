import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CloseButtonProps {
    onPress: () => void;
}

export const CloseButton = ({ onPress }: CloseButtonProps) => (
    <TouchableOpacity onPress={onPress} style={[styles.button, styles.closeButton]} testID="close-button">
        <Ionicons name="close" size={20} color="white" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 40,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default CloseButton;
