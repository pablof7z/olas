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
import { ResizeMode } from 'expo-av';
import { useNDKSession } from '@/ndk-expo/hooks/session'
import { Video } from 'expo-av';
import { manipulateAsync } from 'expo-image-manipulator'
import * as VideoThumbnails from 'expo-video-thumbnails'

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
    let imetaPromise: Promise<void> | null = null;
    let imetaTags: NDKTag[] = [];
    const [selectionType, setSelectionType] = useState<"image" | "video" | null>(null);
    const [thumbnail, setThumbnail] = useState<string | null>(null)
    async function handlePost() {
        if (!selectedImage) {
            console.error("No media to upload");
            return;
        }

        let fileContent: string;
        let contentType: string;
        let eventKind: number;

        fileContent = await FileSystem.readAsStringAsync(selectedImage, {
            encoding: FileSystem.EncodingType.Base64,
        });

        console.log('selectedImage', selectedImage);

        if (selectionType === 'video') {
            eventKind = NDKKind.VerticalVideo;
            contentType = 'video/mp4';
        } else {
            eventKind = 20;
            contentType = 'image/jpeg';
        }
        
        const blob = await fetch(`data:${contentType};base64,${fileContent}`).then((res) =>
            res.blob()
        );

        const event = new NDKEvent(ndk);
        event.kind = eventKind;
        event.content = description;
        event.tags = [];

        const uploadPromise = new Promise<void>(async (resolve, reject) => {
            setUploading(true);
            console.log('uploading thumbnail?', thumbnail);
            // if we have a thumbnail, upload it
            if (thumbnail) {
                const thumbnailBlob = await fetch(thumbnail).then((res) =>
                    res.blob()
                );
                console.log('uploading thumbnail', thumbnailBlob.size);
                const { url } = await upload(ndk, thumbnailBlob, description, defaultBlossomServer);
                event.tags = [...event.tags, ['thumb', url]];
                console.log('thumbnail uploaded', url);
            }
            
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
            console.log('event', event.rawEvent());
            await event.publish();
            setUploading(false);
        } catch (error) {
            console.error("Error uploading media:", error);
        }
    }

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        })

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri)
            setSelectionType(result.assets[0].type)

            console.log('selectedImage type', result.assets[0].type);

            const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            if (result.assets[0].type === 'video') {
                imetaPromise = new Promise<void>((resolve, reject) => {
                    try {
                        VideoThumbnails.getThumbnailAsync(
                            result.assets[0].uri,
                            {
                                time: 0,
                                quality: 0.7,
                            }
                        ).then(({uri}) => {
                            console.log('thumbnail', uri);
                            setThumbnail(uri)
                        })
                    } catch (e) {
                        console.warn('Error generating thumbnail:', e)
                    }
                    resolve();
                });
            } else {
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
        <View style={styles.container} className="flex-1 bg-card">
            {selectedImage ? (
                <KeyboardAwareScrollView>
                    <View className="flex-1 grow mb-4">
                        {selectedImage && (
                            <View style={styles.imageContainer}>
                                {selectionType === 'video' ? (
                                    <View style={styles.imageContainer}>
                                        <Video
                                            source={{ uri: selectedImage }}
                                            style={styles.image}
                                            useNativeControls
                                            resizeMode={ResizeMode.CONTAIN}
                                            posterSource={{ uri: thumbnail }}
                                            usePoster
                                        />
                                    </View>
                                ) : (
                                    <Image
                                        source={{ uri: selectedImage }}
                                        style={styles.image}
                                        contentFit="cover"
                                        contentPosition="center"
                                    />
                                )}
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
                            placeholder="Write a caption or comment..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />

                        {/* <List
                            data={[
                                { title: 'Image', leftView: <Ionicons name="images" size={24} color="#666" /> },
                                { title: 'Audio', leftView: <Ionicons name="mic" size={24} color="#666" /> },
                            ]}
                            renderItem={({item}) => <Text>{item.title}</Text>}
                        /> */}
                    </View>

                    <Button size="lg" variant="primary" onPress={handlePost} disabled={uploading}>
                        {uploading ? <ActivityIndicator /> : <Text className="text-lg text-white">Publish</Text>}
                    </Button>
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
        maxHeight: 240,
        aspectRatio: 1,
        width: '100%'
    },
    image: {
        flex: 1,
        borderRadius: 12,
        width: '100%',
        height: '100%',
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