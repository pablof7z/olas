import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Pressable, Text, Alert } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Reanimated, { useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

    // Try to find a format with 720p or lower resolution
    const optimalFormat = formats.find((f) => f.videoHeight <= 1280 && f.videoWidth <= 720);

    return optimalFormat || formats[0];
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
    const format = device ? selectOptimalFormat(device) : undefined;

    useEffect(() => {
        console.log('Camera Debugging:');
        console.log('- Available devices:', availableDevices);
        console.log('- Mapped devices:', devices);
        console.log('- Current device:', device);
        console.log('- Selected format:', format);
        console.log('- Camera position:', cameraPosition);
        console.log('- Camera permission:', hasCameraPermission);
        console.log('- Mic permission:', hasMicPermission);
    }, [availableDevices, devices, device, format, cameraPosition, hasCameraPermission, hasMicPermission]);

    const pinchGesture = Gesture.Pinch().onUpdate((event) => {
        scale.value = event.scale;
    });

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

    const onMediaCaptured = useCallback((media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
        console.log('Media captured:', { path: media.path, type });
        router.push({
            pathname: '/story/preview',
            params: {
                path: media.path,
                type: type
            }
        });
    }, [router]);

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
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <GestureDetector gesture={pinchGesture}>
                    <View style={{ flex: 1 }}>
                        {device ? (
                            <ReanimatedCamera
                                ref={camera}
                                style={cameraStyle}
                                device={device}
                                format={format}
                                fps={30}
                                isActive={true}
                                photo={true}
                                video={true}
                                audio={true}
                                enableZoomGesture={false}
                                onError={handleCameraError}
                                testID="camera-view"
                            />
                        ) : null}
                    </View>
                </GestureDetector>

                <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
                    <TouchableOpacity onPress={() => router.push('/story/selector')} style={styles.selectorButton} testID="selector-button">
                        <Ionicons name="images-outline" size={30} color="white" />
                    </TouchableOpacity>

                    <Pressable
                        onPress={onShortPress}
                        onLongPress={onLongPress}
                        style={[styles.captureButton, isRecording && styles.recording]}
                        testID="capture-button"
                        disabled={isSwitchingCamera}
                    />

                    <TouchableOpacity
                        onPress={onFlipCamera}
                        style={[styles.flipButton, isSwitchingCamera && styles.disabledButton]}
                        disabled={isSwitchingCamera}
                        testID="flip-button">
                        <Ionicons name="camera-reverse" size={30} color="white" />
                    </TouchableOpacity>
                </View>
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
    disabledButton: {
        opacity: 0.5,
    },
});
