import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Camera,
    type CameraDevice,
    type CameraPosition,
    type CameraRuntimeError,
    type PhotoFile,
    type VideoFile,
    useCameraDevices,
    useCameraPermission,
    useMicrophonePermission,
} from 'react-native-vision-camera';

import NoPermissionsFallback from '@/lib/publish/components/NoPermissionsFallback';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

type Devices = {
    [key in CameraPosition]?: CameraDevice;
};

// Helper function to select optimal format
const _selectOptimalFormat = (device: CameraDevice) => {
    // Sort formats by resolution (prefer lower resolution for better performance)
    const formats = device.formats.sort((a, b) => {
        const aRes = a.videoHeight * a.videoWidth;
        const bRes = b.videoHeight * b.videoWidth;
        return aRes - bRes; // Lower resolution first
    });

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
    const [isLoading, setIsLoading] = useState(false);
    const scale = useSharedValue(1);
    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } =
        useCameraPermission();
    const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } =
        useMicrophonePermission();
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
                Alert.alert(
                    'Camera Error',
                    'There was an error configuring the camera. Please try again.',
                    [{ text: 'OK' }]
                );
                break;
            case 'device/no-device':
                Alert.alert(
                    'Camera Unavailable',
                    'The camera hardware is currently unavailable. Please try again later.',
                    [{ text: 'OK' }]
                );
                break;
            case 'device/microphone-unavailable':
                Alert.alert(
                    'Microphone Error',
                    'The microphone is unavailable. Video recording may not have audio.',
                    [{ text: 'OK' }]
                );
                break;
            default:
                Alert.alert('Camera Error', 'An unexpected error occurred. Please try again.', [
                    { text: 'OK' },
                ]);
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
            Alert.alert('Camera Switch Failed', 'Unable to switch camera. Please try again.', [
                { text: 'OK' },
            ]);
        } finally {
            // Add a small delay before allowing another switch
            setTimeout(() => {
                setIsSwitchingCamera(false);
            }, 1000);
        }
    }, [cameraPosition, devices, isRecording, isSwitchingCamera]);

    const onMediaCaptured = useCallback(
        (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
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

    const _handleBackToCamera = useCallback(() => {
        setIsRecording(false);
    }, []);

    const onShortPress = useCallback(async () => {
        try {
            const photo = await camera.current?.takePhoto();
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

    const handleSelectFromLibrary = useCallback(async () => {
        setIsLoading(true);
        try {
            router.push('/story/selector');
        } catch (error) {
            console.error('Failed to navigate to selector:', error);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    // Handle permissions
    if (!hasCameraPermission) {
        return (
            <NoPermissionsFallback
                onPickImage={handleSelectFromLibrary}
                onRequestPermissions={requestCameraPermission}
                isLoading={isLoading}
                type="permission"
            />
        );
    }

    if (!hasMicPermission) {
        return (
            <NoPermissionsFallback
                onPickImage={handleSelectFromLibrary}
                onRequestPermissions={requestMicPermission}
                isLoading={isLoading}
                type="microphone-permission"
            />
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View
                style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
            >
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
                    ) : (
                        <NoPermissionsFallback
                            onPickImage={handleSelectFromLibrary}
                            onRequestPermissions={() => {}}
                            isLoading={isLoading}
                            type="no-device-available"
                        />
                    )}
                </View>

                {device && (
                    <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
                        <TouchableOpacity
                            onPress={() => router.push('/story/selector')}
                            style={styles.selectorButton}
                            testID="selector-button"
                        >
                            <Ionicons name="images-outline" size={30} color="white" />
                        </TouchableOpacity>

                        <Pressable
                            onPress={onShortPress}
                            onLongPress={onLongPress}
                            onPressOut={() => {
                                if (isRecording) {
                                    onLongPress();
                                }
                            }}
                            style={[styles.captureButton, isRecording && styles.recording]}
                            testID="capture-button"
                            disabled={isSwitchingCamera}
                        />

                        <TouchableOpacity
                            onPress={onFlipCamera}
                            style={[styles.flipButton, isSwitchingCamera && styles.disabledButton]}
                            disabled={isSwitchingCamera}
                            testID="flip-button"
                        >
                            <Ionicons name="camera-reverse" size={30} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    controls: {
        position: 'absolute',
        bottom: 0,
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
