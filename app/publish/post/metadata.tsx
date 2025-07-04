import { useNDK } from '@nostr-dev-kit/ndk-mobile';
import { Stack, router } from 'expo-router';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useActiveBlossomServer } from '@/hooks/blossom';
import Caption from '@/lib/publish/components/composer/metadata/caption';
import Expiration from '@/lib/publish/components/composer/metadata/expiration';
import Location from '@/lib/publish/components/composer/metadata/location';
import ShareOptions from '@/lib/publish/components/composer/metadata/share';
import Visibility from '@/lib/publish/components/composer/metadata/visibility';
import { Preview } from '@/lib/publish/components/preview';
import { useEditorStore } from '@/lib/publish/store/editor';
import { useColorScheme } from '@/lib/useColorScheme';
import { NextButton } from '@/lib/publish/components/NextButton';

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
            <ScrollView
                horizontal
                pagingEnabled
                style={{ flex: 1, height: mediaSize }}
                showsHorizontalScrollIndicator={false}
            >
                {media.map((item) => (
                    <View
                        key={item.id}
                        style={{
                            width: dimensions.width,
                            height: mediaSize,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Preview
                            selectedMedia={{ type: item.mediaType, uri: item.uris[0] }}
                            height={mediaSize}
                            tapToUnmute
                        />
                    </View>
                ))}
            </ScrollView>
        );
    };

    const { colors } = useColorScheme();

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'New Post',
                    headerRight: () => (
                        <NextButton
                            onPress={handlePublish}
                            disabled={isPublishing || media.length === 0}
                            buttonText={isPublishing ? 'Publishing...' : 'Publish'}
                        />
                    ),
                }}
            />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {isPublishing && (
                    <View style={styles.publishingOverlay}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.publishingText}>{state}</Text>
                    </View>
                )}

                <ScrollView>
                    {renderMediaPreview()}
                    <Caption />
                    <Visibility />
                    <Expiration />
                    <Location />
                    <ShareOptions />
                </ScrollView>
            </View>
        </>
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
