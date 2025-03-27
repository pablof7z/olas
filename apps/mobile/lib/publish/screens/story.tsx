import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Camera,
    CameraPosition,
    PhotoFile,
    VideoFile,
    useCameraDevices,
    CameraDevice,
    useCameraPermission,
    useMicrophonePermission,
    CameraRuntimeError,
} from 'react-native-vision-camera';

import CameraToolbar from '@/lib/publish/components/CameraToolbar';
import { POST_TYPE_SWITCHER_HEIGHT } from '@/lib/publish/components/composer/post-type-switcher';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

type Devices = {
    [key in CameraPosition]?: CameraDevice;
};

const PermissionRequest = ({ type, onRequestPermission }: { type: 'camera' | 'microphone'; onRequestPermission: () => void }) => (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name={type === 'camera' ? 'camera-outline' : 'mic-outline'} size={64} color="white" style={{ marginBottom: 16 }} />
        <Text style={styles.permissionText}>
            {type === 'camera' ? 'Camera access is required to take photos and videos' : 'Microphone access is required to record videos'}
        </Text>
        <TouchableOpacity onPress={onRequestPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
    </View>
);

// Helper function to select optimal format
const selectOptimalFormat = (device: CameraDevice) => {
    // Sort formats by resolution (prefer lower resolution for better performance)
    const formats = device.formats.sort((a, b) => {
        const aRes = a.videoHeight * a.videoWidth;
        const bRes = b.videoHeight * b.videoWidth;
        return aRes - bRes; // Lower resolution first
    });

    console.log('formats', JSON.stringify(formats, null, 2));

    // Find the smallest format that is at least 720p
    const optimalFormat = null; // formats.find((f) => f.videoHeight > 720 && f.videoWidth > 720);

    // If no 720p format is found, use the highest resolution format available
    return optimalFormat || formats[formats.length - 1];
};

export default function StoryCameraScreen() {
    // All hooks must be called before any conditional returns
    const camera = useRef<Camera>(null);
    const availableDevices = useCameraDevices();
    const insets = useSafeAreaInsets();
    const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
    const [isRecording, setIsRecording] = useState(false);
    const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
    const scale = useSharedValue(1);
    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
    const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
    const router = useRouter();

    // Map available devices to front/back
    const devices: Devices = {};
    if (Array.isArray(availableDevices)) {
        availableDevices.forEach((device) => {
            if (device.position === 'back' || device.position === 'front') {
                devices[device.position] = device;
            }
        });
    }

    const device = devices[cameraPosition];

    const cameraStyle = useAnimatedStyle(() => ({
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        transform: [{ scale: scale.value }],
    }));

    const handleCameraError = useCallback((error: CameraRuntimeError) => {
        console.error('Camera error:', error);

        // Handle specific error cases
        switch (error.code) {
            case 'device/configuration-error':
                Alert.alert('Camera Error', 'There was an error configuring the camera. Please try again.', [{ text: 'OK' }]);
                break;
            case 'device/no-device':
                Alert.alert('Camera Unavailable', 'The camera hardware is currently unavailable. Please try again later.', [
                    { text: 'OK' },
                ]);
                break;
            case 'device/microphone-unavailable':
                Alert.alert('Microphone Error', 'The microphone is unavailable. Video recording may not have audio.', [{ text: 'OK' }]);
                break;
            case 'unknown/unknown':
            default:
                Alert.alert('Camera Error', 'An unexpected error occurred. Please try again.', [{ text: 'OK' }]);
        }
    }, []);

    const onFlipCamera = useCallback(async () => {
        if (isSwitchingCamera) return; // Prevent multiple rapid switches

        setIsSwitchingCamera(true);

        try {
            // Stop any ongoing recording
            if (isRecording) {
                await camera.current?.stopRecording();
                setIsRecording(false);
            }

            // Check if the target camera exists
            const newPosition = cameraPosition === 'back' ? 'front' : 'back';
            if (!devices[newPosition]) {
                throw new Error(`${newPosition} camera not available`);
            }

            // Switch camera
            setCameraPosition(newPosition);
        } catch (error) {
            console.error('Failed to switch camera:', error);
            Alert.alert('Camera Switch Failed', 'Unable to switch camera. Please try again.', [{ text: 'OK' }]);
        } finally {
            // Add a small delay before allowing another switch
            setTimeout(() => {
                setIsSwitchingCamera(false);
            }, 1000);
        }
    }, [cameraPosition, devices, isRecording, isSwitchingCamera]);

    const onMediaCaptured = useCallback(
        (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
            console.log('Media captured:', { path: media.path, type });
            router.push({
                pathname: '/story/preview',
                params: {
                    path: media.path,
                    type,
                },
            });
        },
        [router]
    );

    const handleBackToCamera = useCallback(() => {
        setIsRecording(false);
    }, []);

    const onShortPress = useCallback(async () => {
        try {
            const photo = await camera.current?.takePhoto();
            console.log('Captured photo:', photo);
            if (photo) {
                onMediaCaptured(photo, 'photo');
            }
        } catch (e) {
            console.error('Failed to take photo:', e);
        }
    }, [onMediaCaptured]);

    const onLongPress = useCallback(async () => {
        try {
            if (isRecording) {
                const video = await camera.current?.stopRecording();
                setIsRecording(false);
                if (video) {
                    onMediaCaptured(video, 'video');
                }
            } else {
                await camera.current?.startRecording({
                    onRecordingFinished: (video) => {
                        console.log('video', video?.width, video?.height);
                        onMediaCaptured(video, 'video');
                    },
                    onRecordingError: (error) => {
                        console.error('Recording failed:', error);
                    },
                });
                setIsRecording(true);
            }
        } catch (e) {
            console.error('Failed to record:', e);
        }
    }, [isRecording, onMediaCaptured]);

    // Handle permissions
    if (!hasCameraPermission) {
        return <PermissionRequest type="camera" onRequestPermission={requestCameraPermission} />;
    }

    if (!hasMicPermission) {
        return <PermissionRequest type="microphone" onRequestPermission={requestMicPermission} />;
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + POST_TYPE_SWITCHER_HEIGHT }]}>
                <View style={{ flex: 1 }}>
                    {device ? (
                        <ReanimatedCamera
                            ref={camera}
                            style={cameraStyle}
                            device={device}
                            isActive
                            photo
                            video
                            audio
                            enableZoomGesture
                            onError={handleCameraError}
                            testID="camera-view"
                        />
                    ) : null}
                </View>

                <CameraToolbar
                    selectorProps={{
                        onPress: () => router.push('/story/selector'),
                        testID: 'selector-button',
                    }}
                    shutterProps={{
                        onPress: onShortPress,
                        onLongPress,
                        onPressOut: () => {
                            if (isRecording) {
                                onLongPress();
                            }
                        },
                        isRecording,
                        disabled: isSwitchingCamera,
                        testID: 'capture-button',
                    }}
                    flipButtonProps={{
                        onPress: onFlipCamera,
                        disabled: isSwitchingCamera,
                        testID: 'flip-button',
                    }}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    permissionText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginHorizontal: 32,
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: 'white',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    permissionButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: '600',
    },
});
