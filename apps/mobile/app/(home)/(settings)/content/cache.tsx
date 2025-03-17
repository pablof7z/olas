import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, Text, Button, Switch, StyleSheet, ScrollView, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useNavigation } from '@react-navigation/native';
import { useObserver } from '@/hooks/observer';
import { NDKImage } from '@nostr-dev-kit/ndk-mobile';

function ContentCacheScreen() {
    const navigation = useNavigation();
    const [fileData, setFileData] = useState<
        Array<{
            name: string;
            uri: string;
            size: number;
            extension: string;
        }>
    >([]);
    const [fileTypesBreakdown, setFileTypesBreakdown] = useState<Record<string, { count: number; totalSize: number }>>({});
    const [previewMode, setPreviewMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [cacheDir, setCacheDir] = useState<string | null>(null);
    const events = useObserver<NDKImage>([{ kinds: [20], limit: 1 }]);

    useEffect(() => {
        if (cacheDir) return;

        async function getCacheDir() {
            for (const event of events) {
                if (!event.imetas?.[0]?.url) continue;
                console.log('getting cache dir for', event.imetas?.[0]?.url);
                const cachedImage = await Image.getCachePathAsync(event.imetas?.[0]?.url);
                if (cachedImage) {
                    const dirName = cachedImage.split('/').slice(0, -1).join('/');
                    console.log('found cache dir', cachedImage, dirName);
                    setCacheDir(dirName);
                    break;
                }
            }
        }

        getCacheDir();
    }, [events]);

    // Fetch files and compute breakdown
    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log('cacheDir', cacheDir);
            const files = await FileSystem.readDirectoryAsync(cacheDir);
            const fileInfos = await Promise.all(
                files.map(async (filename) => {
                    const fileUri = `${cacheDir}/${filename}`;
                    const info = await FileSystem.getInfoAsync(fileUri);
                    let [_, extension] = filename.split('.') || [filename, 'unknown'];
                    extension = extension?.toLowerCase() || 'unknown';
                    console.log('fileInfo', fileUri, info, extension);
                    if (info.isDirectory) return null;
                    return {
                        name: filename,
                        uri: fileUri,
                        size: info.size || 0,
                        extension,
                    };
                })
            );
            const filteredFiles = fileInfos.filter(Boolean) as typeof fileData;
            setFileData(filteredFiles);
            let breakdown: Record<string, { count: number; totalSize: number }> = {};
            filteredFiles.forEach((file) => {
                const ext = file.extension;
                if (!breakdown[ext]) {
                    breakdown[ext] = { count: 0, totalSize: 0 };
                }
                breakdown[ext].count++;
                breakdown[ext].totalSize += file.size;
            });
            setFileTypesBreakdown(breakdown);
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    }, [cacheDir]);

    useEffect(() => {
        if (!cacheDir) return;
        fetchFiles();
    }, [fetchFiles, cacheDir]);

    // Delete cache function with confirmation alert
    const handleDeleteCache = useCallback(() => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete the content cache?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const cacheDir = FileSystem.cacheDirectory;
                        const files = await FileSystem.readDirectoryAsync(cacheDir);
                        await Promise.all(
                            files.map(async (filename) => {
                                const fileUri = cacheDir + filename;
                                await FileSystem.deleteAsync(fileUri, { idempotent: true });
                            })
                        );
                        fetchFiles();
                    } catch (error) {
                        console.error(error);
                    }
                },
            },
        ]);
    }, [fetchFiles]);

    // Add delete cache button to the navigation header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => <Button title="Delete Cache" onPress={handleDeleteCache} />,
        });
    }, [navigation, handleDeleteCache]);

    // Determine if a file is previewable (only images and mp4 videos)
    const isPreviewable = (file: { extension: string }) => {
        return true;
        const previewableExtensions = ['jpg', 'jpeg', 'png', 'mp4'];
        return previewableExtensions.includes(file.extension);
    };

    const previewFiles = fileData.filter(isPreviewable);

    // Render item for the FlashList grid preview
    const renderPreviewItem = ({ item }: { item: (typeof fileData)[0] }) => {
        if (item.extension === 'mp4') {
            return (
                <VideoView
                    source={{ uri: item.uri }}
                    useNativeControls
                    resizeMode="contain"
                    style={styles.previewVideo}
                    shouldPlay={false}
                />
            );
        }
        return <Image source={{ uri: item.uri }} style={styles.previewImage} contentFit="cover" />;
    };

    // Helper function to format bytes into human-readable form
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = 2;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Content Cache Breakdown</Text>
            {Object.keys(fileTypesBreakdown).map((ext) => (
                <View key={ext} style={styles.breakdownItem}>
                    <Text style={styles.breakdownText}>
                        {ext.toUpperCase()}: {fileTypesBreakdown[ext].count} file(s)
                    </Text>
                    <Text style={styles.breakdownText}>{formatBytes(fileTypesBreakdown[ext].totalSize)}</Text>
                </View>
            ))}
            <View style={styles.toggleContainer}>
                <Text>Preview Content</Text>
                <Switch value={previewMode} onValueChange={setPreviewMode} />
            </View>
            {previewMode && (
                <FlashList
                    data={previewFiles}
                    renderItem={renderPreviewItem}
                    numColumns={3}
                    estimatedItemSize={100}
                    keyExtractor={(item) => item.uri}
                    contentContainerStyle={styles.previewContainer}
                />
            )}
        </ScrollView>
    );
}

export default ContentCacheScreen;

const styles = StyleSheet.create({
    container: {},
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 4,
    },
    breakdownText: {
        fontSize: 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 16,
    },
    previewContainer: {
        paddingVertical: 10,
    },
    previewImage: {
        width: 150,
        height: 150,
    },
    previewVideo: {
        width: 150,
        height: 150,
        margin: 4,
    },
});
