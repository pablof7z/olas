import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
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

import CameraToolbar from '@/lib/publish/components/CameraToolbar';
import NoPermissionsFallback from '@/lib/publish/components/NoPermissionsFallback';
import { POST_TYPE_SWITCHER_HEIGHT } from '@/lib/publish/components/composer/post-type-switcher';

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
    const hasCameraDevice = !!device;

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

    const handleSelectMedia = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsMultipleSelection: false,
                quality: 1,
            });

            if (!result.canceled && result.assets.length > 0) {
                const asset = result.assets[0];
                const mediaType = asset.type === 'video' ? 'video' : 'photo';
                router.push({
                    pathname: '/story/preview',
                    params: {
                        path: asset.uri,
                        type: mediaType,
                    },
                });
            }
        } catch (error) {
            console.error('Error selecting media:', error);
            Alert.alert('Error', 'Failed to select media. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const checkDevicesAgain = useCallback(() => {
        // This function is just to give users a way to retry if no devices are found
        // The devices are already checked automatically when the component re-renders
    }, []);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View
                style={[
                    styles.container,
                    {
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom + POST_TYPE_SWITCHER_HEIGHT,
                    },
                ]}
            >
                {!hasCameraPermission ? (
                    <NoPermissionsFallback 
                        onPickImage={handleSelectMedia}
                        onRequestPermissions={requestCameraPermission}
                        isLoading={isLoading}
                        type="permission"
                    />
                ) : !hasMicPermission ? (
                    <NoPermissionsFallback 
                        onPickImage={handleSelectMedia}
                        onRequestPermissions={requestMicPermission}
                        isLoading={isLoading}
                        type="microphone-permission"
                    />
                ) : !hasCameraDevice ? (
                    <NoPermissionsFallback 
                        onPickImage={handleSelectMedia}
                        onRequestPermissions={checkDevicesAgain}
                        isLoading={isLoading}
                        type="no-device-available"
                    />
                ) : (
                    <>
                        <View style={{ flex: 1 }}>
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
                        </View>

                        <CameraToolbar
                            selectorProps={{
                                onPress: handleSelectMedia,
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
                    </>
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
});
