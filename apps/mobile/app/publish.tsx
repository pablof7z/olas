import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { imetaFromImage } from '@/ndk-expo/utils/imeta'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TextInput } from 'react-native'
import { Button } from '@/components/nativewindui/Button'
import { Icon } from '@roninoss/icons'
import { useNDK } from '@/ndk-expo'
import NDK, { NDKEvent, NDKKind, NDKList, NDKTag, NostrEvent } from '@nostr-dev-kit/ndk'
import * as FileSystem from "expo-file-system";
import { Uploader } from '@/ndk-expo/utils/uploader'
import { Image } from 'expo-image'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator'
import { Mic } from 'lucide-react-native'
import { Audio } from 'expo-av';
import { useNDKSession } from '@/ndk-expo/hooks/session'

async function upload(ndk: NDK, blob: Blob, description: string, blossomServer: string): Promise<{url: string | null, mediaEvent: NDKEvent | null}> {
    return new Promise((resolve, reject) => {
        // Create an Uploader instance with the blob
        const uploader = new Uploader(ndk, blob, blossomServer);

        console.log('uploading to', blossomServer);

        // Set up progress and error handlers if needed
        uploader.onProgress = (progress) => {
            console.log(`Upload progress: ${progress}%`);
        };

        uploader.onError = (error) => {
            console.error("Upload error:", error);
            reject(error);
        };

        uploader.onUploaded = async (url) => {
            const mediaEvent = await uploader.mediaEvent();
            resolve({url, mediaEvent});
        };

        // Start the upload
        uploader.start();
    });
}

export default function ImageUpload() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [description, setDescription] = useState('')
    const { follows, events } = useNDKSession();
    const blossomList = useMemo(() => {
        console.log('event kinds', events.keys(), follows.length);
        return events?.get(NDKKind.BlossomList)?.[0] as NDKList | null;
    }, [events, follows]);
    const defaultBlossomServer = useMemo(() => {
        return blossomList?.items.find(item => item[0] === 'server')?.[1] ?? 'https://blossom.primal.net'
    }, [blossomList]);
    const { ndk } = useNDK()
    const [uploading, setUploading] = useState(false);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    let imetaPromise: Promise<void> | null = null;
    let imetaTags: NDKTag[] = [];

    async function handlePost() {
        if (!selectedImage && !audioUri) {
            console.error("No media to upload");
            return;
        }

        let fileContent: string;
        let contentType: string;
        let eventKind: number;

        if (selectedImage) {
            fileContent = await FileSystem.readAsStringAsync(selectedImage, {
                encoding: FileSystem.EncodingType.Base64,
            });
            contentType = 'image/jpeg';
            eventKind = 20;
        }

        const blob = await fetch(`data:${contentType};base64,${fileContent}`).then((res) =>
            res.blob()
        );

        const event = new NDKEvent(ndk);
        event.kind = eventKind;
        event.content = description;
        event.tags = [];

        const uploadPromise = new Promise<void>((resolve, reject) => {
            setUploading(true);
            upload(ndk, blob, description, defaultBlossomServer).then((ret) => {
                setUploading(false);
                event.tags = [...event.tags, ...(ret.mediaEvent?.tags??[])];
                resolve();
            })
        });

        // Only do imeta for images
        await Promise.all([uploadPromise, imetaPromise]);

        try {
            await event.sign();
            await event.publish();
            setUploading(false);
            setAudioUri(null);
        } catch (error) {
            console.error("Error uploading media:", error);
        }
    }

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        })

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri)

            const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            imetaPromise = new Promise<void>((resolve, reject) => {
                imetaFromImage(fileContent).then((tags: NDKTag[]) => {
                    imetaTags = tags;
                    console.log('imetaTags', imetaTags);
                    resolve();
                }).catch((error) => {
                    console.error('imetaFromImage error', error);
                    reject(error);
                });
            });
        }
    }

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync()
        if (status !== 'granted') {
            alert('Sorry, we need camera permissions to make this work!')
            return
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
            mediaTypes: ImagePicker.MediaTypeOptions.All,
        })

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri)
        }
    }

    return (
        <View style={styles.container}>
            {selectedImage || audioUri ? (
                <KeyboardAwareScrollView>
                    <View className="flex-row w-full h-[30px]">
                        <View className="flex-1"></View>

                        <TouchableOpacity className="h-[26px] w-fit shrink" onPress={handlePost} disabled={uploading}>
                            {uploading ? <ActivityIndicator /> : <Text className="text-primary font-bold">Publish</Text>}
                        </TouchableOpacity>
                    </View>
                    
                    <View className="flex-1 grow">
                        {selectedImage && (
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: selectedImage }}
                                    style={styles.image}
                                    contentFit="cover"
                                    contentPosition="center"
                                />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => {
                                        setSelectedImage(null)
                                        setDescription('')
                                    }}
                                >
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        )}
                        
                        <TextInput
                            style={styles.textInput}
                            placeholder={selectedImage ? "Write something about your image..." : "Add a description for your audio..."}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                    </View>
                </KeyboardAwareScrollView>
            ) : (
                <View style={styles.uploadContainer}>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={pickImage}>
                            <Ionicons name="images" size={40} color="#666" />
                            <Text style={styles.buttonText}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.button} onPress={takePhoto}>
                            <Ionicons name="camera" size={40} color="#666" />
                            <Text style={styles.buttonText}>Camera</Text>
                        </TouchableOpacity>
                    </View>

                    
                    <Text style={styles.helperText}>
                        Upload a photo or take a new one
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    imageContainer: {
        position: 'relative',
        aspectRatio: 1,
        width: '100%',
    },
    image: {
        flex: 1,
        borderRadius: 12,
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
    uploadContainer: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#ccc',
        borderRadius: 12,
        padding: 32,
    },
    buttonContainer: {
        height: 250,
        gap: 16,
        flexDirection: 'column',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#ccc',
        borderRadius: 12,
        marginHorizontal: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    helperText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        textAlign: 'center',
    },
    textInput: {
        marginTop: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    audioContainer: {
        position: 'relative',
        width: '100%',
        padding: 20,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    audioText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
}) 