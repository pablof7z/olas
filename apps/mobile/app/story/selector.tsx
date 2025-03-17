import React, { useEffect, useState } from 'react';
import { View, Image, FlatList, StyleSheet, Dimensions, TouchableOpacity, Text, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FlashList } from '@shopify/flash-list';

const { width, height } = Dimensions.get('window');
const aspectRatio = width / height;

export default function MediaSelector() {
    const [media, setMedia] = useState<MediaLibrary.Asset[]>([]);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const router = useRouter();

    const numColumns = 3;
    const itemSize = width / numColumns;

    useEffect(() => {
        (async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setHasPermission(status === 'granted');

            if (status === 'granted') {
                const assets = await MediaLibrary.getAssetsAsync({
                    mediaType: ['photo'],
                    sortBy: ['creationTime'],
                    first: 100,
                });
                setMedia(assets.assets);
            }
        })();
    }, []);

    const handleSelect = async (asset: MediaLibrary.Asset) => {
        // For iOS photo assets, we need to ensure the ID is properly formatted
        // The asset uri from MediaLibrary is already in correct format for display

        // Get the full asset info to make sure we have all the data we need
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);

        router.push({
            pathname: '/story/preview' as const,
            params: {
                path: assetInfo.localUri,
                type: 'photo',
            },
        });
    };

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text>Requesting media library permissions...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text>No access to media library</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <FlashList
                data={media}
                numColumns={numColumns}
                estimatedItemSize={itemSize}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => handleSelect(item)}
                        style={[styles.imageContainer, { width: itemSize, height: itemSize / aspectRatio }]}>
                        <Image source={{ uri: item.uri }} style={styles.image} />
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    imageContainer: {
        padding: 1,
        position: 'relative',
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    selectedImage: {
        borderWidth: 2,
        borderColor: '#3498db',
    },
    button: {
        backgroundColor: '#3498db',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        margin: 16,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
