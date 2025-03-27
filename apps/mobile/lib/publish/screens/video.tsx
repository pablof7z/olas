import React, { useCallback, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Alert } from 'react-native';
import {
    Camera,
    CameraPosition,
    VideoFile,
    useCameraDevices,
    CameraDevice,
    useCameraPermission,
    useMicrophonePermission,
    CameraRuntimeError,
} from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { POST_TYPE_SWITCHER_HEIGHT } from '@/lib/publish/components/composer/post-type-switcher';
import { useEditorStore } from '@/lib/publish/store/editor';
import CameraToolbar from '@/lib/publish/components/CameraToolbar';

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

export default function VideoScreen() {
    const camera = useRef<Camera>(null);
    const availableDevices = useCameraDevices();
    const insets = useSafeAreaInsets();
    const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
    const [isRecording, setIsRecording] = useState(false);
    const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
    const scale = useSharedValue(1);
    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
    const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
    const { addMedia } = useEditorStore();

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

    const handleVideoRecorded = useCallback(async (video: VideoFile) => {
        console.log('Video recorded:', video);
        try {
            await addMedia(video.path, 'video');
            router.push('/publish/post/metadata');
        } catch (error) {
            console.error('Failed to save video:', error);
            Alert.alert('Error', 'Failed to save the recorded video. Please try again.');
        }
    }, [addMedia]);

    const toggleRecording = useCallback(async () => {
        try {
            if (isRecording) {
                await camera.current?.stopRecording();
                setIsRecording(false);
            } else {
                await camera.current?.startRecording({
                    onRecordingFinished: (video) => {
                        console.log('Video recorded:', video);
                        setIsRecording(false);
                        handleVideoRecorded(video);
                    },
                    onRecordingError: (error) => {
                        console.error('Recording failed:', error);
                        setIsRecording(false);
                        Alert.alert('Recording Error', 'Failed to record video. Please try again.');
                    },
                });
                setIsRecording(true);
            }
        } catch (e) {
            console.error('Failed to handle recording:', e);
            Alert.alert('Error', 'Failed to start or stop recording. Please try again.');
            setIsRecording(false);
        }
    }, [isRecording, handleVideoRecorded]);

    const handleSelectVideo = useCallback(async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsMultipleSelection: false,
                quality: 1,
                exif: true,
            });

            if (!result.canceled && result.assets.length > 0) {
                const selectedAsset = result.assets[0];
                await addMedia(selectedAsset.uri, 'video');
                router.push('/publish/post/metadata');
            }
        } catch (error) {
            console.error('Error selecting video:', error);
            Alert.alert('Error', 'Failed to select video. Please try again.');
        }
    }, [addMedia]);

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
                            isActive={true}
                            video={true}
                            audio={true}
                            enableZoomGesture={true}
                            onError={handleCameraError}
                            testID="camera-view"
                        />
                    ) : null}
                </View>

                <CameraToolbar
                    selectorProps={{
                        onPress: handleSelectVideo,
                        testID: 'video-selector-button'
                    }}
                    shutterProps={{
                        onPress: toggleRecording,
                        isRecording: isRecording,
                        disabled: isSwitchingCamera,
                        testID: 'record-button'
                    }}
                    flipButtonProps={{
                        onPress: onFlipCamera,
                        disabled: isSwitchingCamera,
                        testID: 'flip-button'
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
        textAlign: 'center',
        marginHorizontal: 24,
        marginBottom: 16,
        fontSize: 16,
    },
    permissionButton: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    permissionButtonText: {
        fontWeight: '600',
        fontSize: 16,
    },
}); 