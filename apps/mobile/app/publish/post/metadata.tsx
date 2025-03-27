import { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useEditorStore } from '@/lib/publish/store/editor';
import PostCaptionBottomSheet from '@/lib/publish/components/composer/metadata/CaptionBottomSheet';
import LocationBottomSheet from '@/lib/publish/components/composer/metadata/LocationBottomSheet';
import { Stack, router } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { useActiveBlossomServer } from '@/hooks/blossom';
import React from 'react';
import Caption from '@/lib/publish/components/composer/metadata/caption';
import Expiration from '@/lib/publish/components/composer/metadata/expiration';
import Location from '@/lib/publish/components/composer/metadata/location';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Preview } from '@/lib/publish/components/preview';

const dimensions = Dimensions.get('window');

export default function PostMetadataScreen() {
    const media = useEditorStore((state) => state.media);
    const isPublishing = useEditorStore((state) => state.isPublishing);
    const state = useEditorStore((state) => state.state);
    const publish = useEditorStore((state) => state.publish);
    const { ndk } = useNDK();
    const blossomServer = useActiveBlossomServer();

    const mediaSize = dimensions.height * 0.3;

    const handlePublish = useCallback(async () => {
        if (!ndk || !blossomServer) {
            console.error('NDK or blossom server not available');
            return;
        }

        try {
            router.replace('/(home)');
            await publish(ndk, blossomServer);
        } catch (error) {
            console.error('Failed to publish post:', error);
        }
    }, [ndk, blossomServer, publish]);

    const renderMediaPreview = () => {
        if (media.length === 0) {
            return (
                <View style={styles.emptyMediaContainer}>
                    <Text style={styles.emptyMediaText}>No media selected</Text>
                </View>
            );
        }

        return (
            <ScrollView horizontal pagingEnabled style={{ flex: 1, height: mediaSize }} showsHorizontalScrollIndicator={false}>
                {media.map((item) => (
                    <View
                        key={item.id}
                        style={{
                            width: dimensions.width,
                            height: mediaSize,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                        <Preview selectedMedia={{ type: item.mediaType, uri: item.uris[0] }} height={mediaSize} tapToUnmute={true} />
                    </View>
                ))}
            </ScrollView>
        );
    };

    const { colors } = useColorScheme();

    return (
        <BottomSheetModalProvider>
            <Stack.Screen
                options={{
                    contentStyle: {
                        backgroundColor: 'white',
                    },
                    headerShown: true,
                    title: 'New Post',
                    headerRight: () => (
                        <TouchableOpacity onPress={handlePublish} disabled={isPublishing || media.length === 0}>
                            {isPublishing ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Text
                                    style={{
                                        color: media.length === 0 ? colors.grey2 : colors.primary,
                                        fontWeight: '600',
                                        fontSize: 16,
                                        opacity: media.length === 0 ? 0.5 : 1,
                                    }}>
                                    Publish
                                </Text>
                            )}
                        </TouchableOpacity>
                    ),
                }}
            />
            <View style={styles.container}>
                {isPublishing && (
                    <View style={styles.publishingOverlay}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.publishingText}>{state}</Text>
                    </View>
                )}

                <ScrollView>
                    {renderMediaPreview()}
                    <Caption />
                    <Expiration />
                    <Location />
                </ScrollView>

                <PostCaptionBottomSheet />
                <LocationBottomSheet />
            </View>
        </BottomSheetModalProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
    emptyMediaContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    emptyMediaText: {
        color: '#999',
    },
    mediaContainer: {
        width: '100%',
        height: 300,
        backgroundColor: 'red',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    publishingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    publishingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
});
