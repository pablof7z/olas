import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

export type FallbackType = 'permission' | 'no-device-available' | 'microphone-permission';

interface NoPermissionsFallbackProps {
    onPickImage: () => Promise<void> | void;
    onRequestPermissions: () => Promise<void> | Promise<boolean> | void;
    isLoading: boolean;
    type?: FallbackType;
}

export default function NoPermissionsFallback({
    onPickImage,
    onRequestPermissions,
    isLoading,
    type = 'permission'
}: NoPermissionsFallbackProps) {
    const getMessage = () => {
        switch (type) {
            case 'no-device-available':
                return 'Camera is not available on this device. You can still select media from your library.';
            case 'microphone-permission':
                return 'Microphone access is required to record videos with sound.';
            default:
                return 'Media library access is required to browse photos and videos';
        }
    };

    const getRetryButtonText = () => {
        switch (type) {
            case 'no-device-available':
                return 'Check Again';
            default:
                return 'Try Again';
        }
    };

    return (
        <View style={styles.permissionOverlay}>
            <Text style={styles.permissionText}>
                {getMessage()}
            </Text>
            <TouchableOpacity 
                style={styles.pickImageButton}
                onPress={onPickImage}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.pickImageButtonText}>
                        Select from Photo Library
                    </Text>
                )}
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.pickImageButton, styles.secondaryButton]}
                onPress={onRequestPermissions}
            >
                <Text style={styles.pickImageButtonText}>
                    {getRetryButtonText()}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    permissionOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    permissionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    pickImageButton: {
        backgroundColor: '#3478F6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginVertical: 8,
        width: '80%',
        alignItems: 'center',
    },
    pickImageButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#333',
    },
}); 