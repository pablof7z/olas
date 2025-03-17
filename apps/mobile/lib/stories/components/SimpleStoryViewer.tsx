import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import { Image, ImageStyle, useImage } from 'expo-image';
import { NDKStory } from '@nostr-dev-kit/ndk-mobile';
import StoryStickersContainer from './StoryStickersContainer';
import { StoryHeader } from './header';
import StoryText from './StoryText';
import { useColorScheme } from '@/lib/useColorScheme';

interface SimpleStoryViewerProps {
    story: NDKStory;
    active?: boolean;
    onNext?: () => void;
    onPrev?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SimpleStoryViewer({ story, active = true, onNext, onPrev }: SimpleStoryViewerProps) {
    const imeta = story.imeta;

    const imageSource = useImage({ uri: imeta!.url });

    return (
        <View style={[styles.container, { backgroundColor: 'black' }]}>
            {/* Media Content */}
            {imageSource ? (
                <Image
                    style={styles.media}
                    source={imageSource}
                    contentFit="cover"
                />
            ) : (
                <View style={styles.noMedia}>
                    <Text style={styles.noMediaText}>No media available</Text>
                </View>
            )}

            {/* Stickers Layer */}
            <StoryStickersContainer event={story} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    media: {
        flex: 1,
        width: screenWidth,
        height: screenHeight,
    },
    noMedia: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noMediaText: {
        color: 'white',
        fontSize: 16,
    },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
    },
    textContainer: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        padding: 16,
        zIndex: 20,
    },
    touchContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        zIndex: 15,
    },
    prevTouch: {
        flex: 1,
    },
    nextTouch: {
        flex: 2,
    },
}); 