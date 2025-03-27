import React from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { POST_TYPE_SWITCHER_HEIGHT } from './composer/post-type-switcher';

export type SelectorButtonProps = {
    onPress: () => void;
    testID?: string;
};

export type ShutterButtonProps = {
    onPress: () => void;
    onLongPress?: () => void;
    onPressOut?: () => void;
    isRecording?: boolean;
    disabled?: boolean;
    testID?: string;
};

export type FlipButtonProps = {
    onPress: () => void;
    disabled?: boolean;
    testID?: string;
};

type CameraToolbarProps = {
    selectorProps: SelectorButtonProps;
    shutterProps: ShutterButtonProps;
    flipButtonProps: FlipButtonProps;
};

export default function CameraToolbar({
    selectorProps,
    shutterProps,
    flipButtonProps,
}: CameraToolbarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity 
                onPress={selectorProps.onPress} 
                style={styles.selectorButton}
                testID={selectorProps.testID || 'selector-button'}>
                <Ionicons name="images-outline" size={30} color="white" />
            </TouchableOpacity>

            {shutterProps.onLongPress ? (
                <Pressable
                    onPress={shutterProps.onPress}
                    onLongPress={shutterProps.onLongPress}
                    onPressOut={shutterProps.onPressOut}
                    style={[styles.captureButton, shutterProps.isRecording && styles.recording]}
                    testID={shutterProps.testID || 'capture-button'}
                    disabled={shutterProps.disabled}
                />
            ) : (
                <TouchableOpacity
                    onPress={shutterProps.onPress}
                    style={[styles.captureButton, shutterProps.isRecording && styles.recording]}
                    testID={shutterProps.testID || 'capture-button'}
                    disabled={shutterProps.disabled}
                />
            )}

            <TouchableOpacity
                onPress={flipButtonProps.onPress}
                style={[styles.flipButton, flipButtonProps.disabled && styles.disabledButton]}
                disabled={flipButtonProps.disabled}
                testID={flipButtonProps.testID || 'flip-button'}>
                <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    controls: {
        position: 'absolute',
        bottom: POST_TYPE_SWITCHER_HEIGHT,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
    },
    selectorButton: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    recording: {
        backgroundColor: '#ff4444',
        borderColor: 'rgba(255, 0, 0, 0.5)',
    },
    flipButton: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
}); 