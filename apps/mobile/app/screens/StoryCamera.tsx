import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Pressable, Text } from 'react-native';
import { Camera, CameraPosition, PhotoFile, VideoFile, useCameraDevices, CameraDevice, useCameraPermission, useMicrophonePermission, CameraRuntimeError } from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Reanimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

type Devices = {
    [key in CameraPosition]?: CameraDevice;
};

export default function StoryCamera() {
    const camera = useRef<Camera>(null);
    const availableDevices = useCameraDevices();
    const insets = useSafeAreaInsets();
    const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
    const [isRecording, setIsRecording] = useState(false);
    const scale = useSharedValue(1);
    
    // Map available devices to front/back
    const devices: Devices = {};
    if (Array.isArray(availableDevices)) {
        availableDevices.forEach(device => {
            if (device.position === 'back' || device.position === 'front') {
                devices[device.position] = device;
            }
        });
    }
    
    const device = devices[cameraPosition];
    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
    const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();

    useEffect(() => {
        console.log('Camera Debugging:');
        console.log('- Available devices:', availableDevices);
        console.log('- Mapped devices:', devices);
        console.log('- Current device:', device);
        console.log('- Camera position:', cameraPosition);
        console.log('- Camera permission:', hasCameraPermission);
        console.log('- Mic permission:', hasMicPermission);
    }, [availableDevices, devices, device, cameraPosition, hasCameraPermission, hasMicPermission]);

    // Request permissions if not granted
    if (!hasCameraPermission) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="camera-outline" size={64} color="white" style={{ marginBottom: 16 }} />
                <Text style={styles.permissionText}>Camera access is required to take photos and videos</Text>
                <TouchableOpacity 
                    onPress={requestCameraPermission}
                    style={styles.permissionButton}
                >
                    <Text style={styles.permissionButtonText}>Grant Access</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!hasMicPermission) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="mic-outline" size={64} color="white" style={{ marginBottom: 16 }} />
                <Text style={styles.permissionText}>Microphone access is required to record videos</Text>
                <TouchableOpacity 
                    onPress={requestMicPermission}
                    style={styles.permissionButton}
                >
                    <Text style={styles.permissionButtonText}>Grant Access</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = event.scale;
        });

    const cameraStyle = useAnimatedStyle(() => ({
        flex: 1,
        borderRadius: 20,
        transform: [{ scale: scale.value }],
    }));

    const onFlipCamera = useCallback(() => {
        setCameraPosition(p => p === 'back' ? 'front' : 'back');
    }, []);

    const onMediaCaptured = useCallback(
        (media: PhotoFile | VideoFile, type: 'photo' | 'video') => {
            console.log('Media captured:', { path: media.path, type });
            router.push({
                pathname: '/story/preview',
                params: {
                    path: media.path,
                    type
                }
            });
        },
        []
    );

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

    const onError = useCallback((error: CameraRuntimeError) => {
        console.error('Camera error:', error);
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <GestureDetector gesture={pinchGesture}>
                <View style={{ flex: 1 }}>
                    {device ? (
                        <ReanimatedCamera
                            ref={camera}
                            style={cameraStyle}
                            device={device}
                            isActive={true}
                            photo={true}
                            video={true}
                            audio={true}
                            enableZoomGesture={false}
                            onError={onError}
                            testID="camera-view"
                        />
                    ) : null}
                </View>
            </GestureDetector>

            <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.spacer} />

                <Pressable
                    onPress={onShortPress}
                    onLongPress={onLongPress}
                    style={[styles.captureButton, isRecording && styles.recording]}
                    testID="capture-button"
                />

                <TouchableOpacity 
                    onPress={onFlipCamera} 
                    style={styles.flipButton}
                    testID="flip-button"
                >
                    <Ionicons name="camera-reverse" size={30} color="white" />
                </TouchableOpacity>
            </View>
        </View>
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
    spacer: {
        width: 50,
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
}); 