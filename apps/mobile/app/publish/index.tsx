import { View, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/nativewindui/Button';
import { useNDK, useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import NDK, { NDKEvent, NDKKind, NDKList } from '@nostr-dev-kit/ndk-mobile';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { ResizeMode } from 'expo-av';
import { Video } from 'expo-av';
import { useColorScheme } from '@/lib/useColorScheme';
import { router, Stack } from 'expo-router';
import { publishStore } from '../stores/publish';
import { useStore } from 'zustand';
import { List, ListItem } from '@/components/nativewindui/List';
import { cn } from '@/lib/cn';
import { ImageIcon, Plus, Timer, Type, VideoIcon } from 'lucide-react-native';
import { Uploader } from '@/utils/uploader';
import { ImetaData, imetaFromImage, imetaToTags } from '@/utils/imeta';

async function upload(ndk: NDK, blob: Blob, blossomServer: string): Promise<{ url: string | null; x: string | null; mediaEvent: NDKEvent | null }> {
    return new Promise((resolve, reject) => {
        // Create an Uploader instance with the blob
        const uploader = new Uploader(ndk, blob, blossomServer);

        // Set up progress and error handlers if needed
        uploader.onProgress = (progress) => {
            console.log(`Upload progress: ${progress}%`);
        };

        uploader.onError = (error) => {
            console.error('Upload error:', error);
            reject(error);
        };

        uploader.onUploaded = async (url) => {
            const mediaEvent = await uploader.mediaEvent();
            const x = mediaEvent?.tagValue('x');
            resolve({ url, x, mediaEvent });
        };

        // Start the upload
        uploader.start();
    });
}

function PostOptions({
    handlePost,
    uploading,
    media,
    pickImage,
    takePhoto,
}: {
    handlePost: () => void;
    uploading: boolean;
    media: Media[];
    pickImage: () => void;
    takePhoto: () => void;
}) {
    const { caption, expiration, type } = useStore(publishStore);
    const { colors } = useColorScheme();

    const openCaption = () => router.push('/publish/caption');
    const openExpiration = () => router.push('/publish/expiration');
    const openType = () => router.push('/publish/type');

    const calculateRelativeExpirationTimeInDaysOrHours = (expiration: number) => {
        const now = new Date().getTime() - 600 * 1000;
        const diff = expiration - now;
        if (diff >= 1000 * 60 * 60 * 24) {
            return `${Math.round(diff / (1000 * 60 * 60 * 24))} days`;
        }
        return `${Math.round(diff / (1000 * 60 * 60))} hours`;
    };

    const data = useMemo(() => {
        const data = [
            {
                id: 'expiration',
                title: 'Expiration',
                subTitle: 'Delete post after some time',
                onPress: openExpiration,
                leftView: (
                    <View style={{ paddingHorizontal: 10 }}>
                        <Timer size={24} color={colors.muted} />
                    </View>
                ),
                rightView: (
                    <View className="flex-1 justify-center">
                        <Text className="text-sm text-muted-foreground">
                            {expiration ? `${calculateRelativeExpirationTimeInDaysOrHours(expiration)}` : 'None'}
                        </Text>
                    </View>
                ),
            },
            {
                id: 'type',
                title: 'Post type',
                subTitle: 'Choose the type of post',
                onPress: openType,
                leftView: (
                    <View style={{ paddingHorizontal: 10 }}>
                        <Type size={24} color={colors.muted} />
                    </View>
                ),
                rightView: (
                    <View className="flex-1 justify-center">
                        <Text className="text-sm text-muted-foreground">
                            {type === 'generic' && 'Generic'}
                            {type === 'high-quality' && 'High-quality'}
                        </Text>
                    </View>
                ),
            },
        ];

        if (media.length > 0) {
            data.push({
                id: 'add-more',
                title: 'Add more media',
                subTitle: 'Add more photos or videos',
                onPress: () => {},
                leftView: (
                    <View style={{ paddingHorizontal: 10 }}>
                        <Plus size={24} color={colors.muted} />
                    </View>
                ),
                rightView: (
                    <View className="flex-1 flex-row justify-center gap-2">
                        <Button variant="tonal" onPress={pickImage}>
                            <ImageIcon size={24} color={colors.muted} />
                        </Button>

                        <Button variant="tonal" onPress={takePhoto}>
                            <VideoIcon size={24} color={colors.muted} />
                        </Button>
                    </View>
                ),
            });
        }

        data.push({ id: 'publish', onPress: handlePost });

        return data;
    }, [expiration, type, media.length]);

    return (
        <>
            <TouchableOpacity onPress={openCaption} className="dark:border-border/80 mt-4 min-h-24 rounded-lg border border-border p-2">
                <Text className="text-sm text-muted-foreground">{caption.trim().length > 0 ? caption : 'Add a caption'}</Text>
            </TouchableOpacity>

            <List
                data={data}
                contentContainerClassName="pt-4"
                contentInsetAdjustmentBehavior="automatic"
                renderItem={({ item, index, target }) => {
                    if (item.id === 'publish') {
                        return (
                            <Button size="lg" variant="primary" onPress={handlePost} disabled={uploading || media.length === 0}>
                                {uploading ? <ActivityIndicator /> : <Text className="text-lg text-white">Publish</Text>}
                            </Button>
                        );
                    }

                    return (
                        <ListItem
                            className={cn('ios:pl-0 pl-2', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
                            item={item}
                            leftView={item.leftView}
                            rightView={item.rightView}
                            onPress={item.onPress}
                            index={index}
                            target={target}
                        />
                    );
                }}
            />
        </>
    );
}

type Media = {
    internalUri: string;
    imeta?: ImetaData;
    imetaPromise?: Promise<void>;
    uploadPromise?: Promise<void>;
};

export default function ImageUpload() {
    const { type } = useStore(publishStore);
    const { follows, events } = useNDKSession();
    const blossomList = useMemo(() => {
        return events?.get(NDKKind.BlossomList)?.[0] as NDKList | null;
    }, [events, follows]);
    const defaultBlossomServer = useMemo(() => {
        return blossomList?.items.find((item) => item[0] === 'server')?.[1] ?? 'https://nostr.download';
    }, [blossomList]);
    const { ndk } = useNDK();
    const [uploading, setUploading] = useState(false);

    const { expiration, caption } = useStore(publishStore);
    const [selectionType, setSelectionType] = useState<'image' | 'video' | null>(null);
    const [thumbnail, setThumbnail] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refresh, setRefresh] = useState(0);

    const media = useRef<Media[]>([]);

    async function handlePost() {
        if (media.current.length === 0) {
            setError('No media to upload');
            return;
        }

        let eventKind: number;

        if (type === 'generic') {
            eventKind = NDKKind.Text;
        } else if (selectionType === 'video') {
            eventKind = NDKKind.VerticalVideo;
        } else {
            eventKind = NDKKind.Image;
        }

        const event = new NDKEvent(ndk);
        event.kind = eventKind;
        event.content = caption;
        event.tags = [];

        setUploading(true);
        for (const [index, m] of media.current.entries()) {
            const promise = new Promise<void>(async (resolve, reject) => {
                const mediaBlob = await fetch(m.internalUri).then((res) => res.blob());
                const { url, x } = await upload(ndk, mediaBlob, defaultBlossomServer);
                media.current[index].imeta ??= {};
                media.current[index].imeta.url = url;
                media.current[index].imeta.x = x;
                resolve();
            });

            media.current[index].uploadPromise = promise;
        }

        await Promise.all([...media.current.map((m) => m.uploadPromise), ...media.current.map((m) => m.imetaPromise)]);

        event.tags = [
            ...event.tags,
            ...media.current
                .filter((media) => media.imeta)
                .map((media) => imetaToTags(media.imeta))
                .flat(),
        ];

        // if we have an expiration, set the tag
        if (expiration) {
            event.tags = [...event.tags, ['expiration', Math.floor(expiration / 1000).toString()]];
        }

        // if this is a generic post, add the URL to the content's end
        if (type === 'generic') {
            event.content = [
                event.content,
                ...media.current
                    .map((m) => m.imeta.url)
                    .filter((text) => text?.trim().length > 0)
                    .map((text) => text + '.jpg'),
            ].join('\n');

            // ok, this is cheating, I know -- ading a k tag to be able to find this post easily
            event.tags = [...event.tags, ['k', (selectionType === 'video' ? NDKKind.VerticalVideo : NDKKind.Image).toString()]];
        }

        try {
            await event.sign();
            await event.publish();
            setUploading(false);
            console.log('publishing done, going back');
            router.back();
        } catch (error) {
            setError('Error publishing post!');
        }
    }

    useEffect(() => {
        if (error && uploading) {
            setUploading(false);
        }
    }, [error]);

    const processMedia = async (mediaUri: string) => {
        // generate imeta, add the promise to imetaPromises
        // when the promise resolves, add the imeta to the imetas record using the mediaUri as the key
        // and add the url to addMedia

        // push the media to the medias array
        const index = media.current.length;
        const m: Media = { internalUri: mediaUri };

        const fileContent = await FileSystem.readAsStringAsync(mediaUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        m.imetaPromise = imetaFromImage(fileContent).then((imeta) => {
            media.current[index].imeta = { ...media.current[index].imeta, ...imeta };
        });
        media.current.push(m);
        setRefresh(refresh + 1);
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            processMedia(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
            mediaTypes: ImagePicker.MediaTypeOptions.All,
        });

        if (!result.canceled) {
            processMedia(result.assets[0].uri);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Publish',
                    headerRight: () => (
                        <Button variant="primary" size="sm" onPress={handlePost} disabled={uploading || media.length === 0}>
                            <Text className="text-white">Publish</Text>
                        </Button>
                    ),
                }}
            />
            <View style={styles.container} className="flex-1 flex-row bg-card">
                {error && <Text className="mb-4 text-center text-red-500">{error}</Text>}
                <View className="mb-4 flex-1 grow">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                        {media.current.map((m, index) => (
                            <View
                                key={m.internalUri}
                                style={[
                                    styles.imageContainer,
                                    {
                                        marginRight: 10,
                                        width: Dimensions.get('screen').width * 0.8,
                                    },
                                ]}>
                                {selectionType === 'video' ? (
                                    <Video
                                        source={{ uri: m.internalUri }}
                                        style={styles.image}
                                        useNativeControls
                                        resizeMode={ResizeMode.CONTAIN}
                                        posterSource={{ uri: thumbnail }}
                                        usePoster
                                    />
                                ) : (
                                    <Image
                                        source={{ uri: m.internalUri }}
                                        style={styles.image}
                                        contentFit="cover"
                                        contentPosition="center"
                                    />
                                )}
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => {
                                        media.current = media.current.filter((m, j) => j !== index);
                                        setRefresh(refresh + 1);
                                    }}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <View
                            style={{
                                ...styles.buttonContainer,
                                width: Dimensions.get('screen').width - 20,
                            }}
                            className="dark:border-border/80 min-h-24 rounded-lg p-2">
                            <Button variant="tonal" style={styles.button} onPress={pickImage}>
                                <ImageIcon size={40} color="#666" />
                                <Text className="px-4 text-lg text-foreground">Gallery</Text>
                            </Button>

                            <Button variant="tonal" style={styles.button} onPress={takePhoto}>
                                <VideoIcon size={40} color="#666" />
                                <Text className="px-4 text-lg text-foreground">Camera</Text>
                            </Button>
                        </View>
                    </ScrollView>

                    <PostOptions
                        handlePost={handlePost}
                        uploading={uploading}
                        media={media.current}
                        pickImage={() => pickImage()}
                        takePhoto={() => takePhoto()}
                    />
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    imageContainer: {
        position: 'relative',
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
    uploadContainer: {},
    buttonContainer: {
        flex: 1,
        gap: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
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
});
