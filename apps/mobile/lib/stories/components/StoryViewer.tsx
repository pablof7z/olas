import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Image, ImageStyle, useImage } from 'expo-image';
import { Video } from 'expo-av';
import { NDKStory } from '@nostr-dev-kit/ndk-mobile';
import StoryStickersContainer from './StoryStickersContainer';
import { StoryHeader } from './header';
import StoryText from './StoryText';
import { urlIsVideo } from '@/utils/media';
import { useColorScheme } from '@/lib/useColorScheme';

interface StoryViewerProps {
    story: NDKStory;
    active?: boolean;
    onNext?: () => void;
    onPrev?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StoryViewer({ story, active = true, onNext, onPrev }: StoryViewerProps) {
    const { colors } = useColorScheme();
    const [isLoading, setIsLoading] = useState(true);
    const [mediaDimensions, setMediaDimensions] = useState({ width: 0, height: 0 });
    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [videoRef, setVideoRef] = useState<Video | null>(null);

    // Extract media from the story
    useEffect(() => {
        if (!story) {
            console.error('No story provided');
            return;
        }

        // Find imeta tags in the story
        const imetaTag = story.tags.find(tag => tag[0] === 'imeta');
        if (!imetaTag || imetaTag.length < 2) {
            console.error('No imeta tag found in story');
            return;
        }

        try {
            // Parse the imeta tag
            const imetaData = JSON.parse(imetaTag[1]);
            if (!imetaData.url) {
                console.error('No URL in imeta');
                return;
            }

            setMediaUrl(imetaData.url);
            
            // Determine media type
            if (urlIsVideo(imetaData.url)) {
                setMediaType('video');
            } else {
                setMediaType('image');
            }
        } catch (error) {
            console.error('Error parsing imeta:', error);
        }
    }, [story]);

    // Get image source if media is an image
    const imageSource = useImage(
        mediaType === 'image' && mediaUrl 
            ? { uri: mediaUrl }
            : undefined
    );

    // Handle image load events
    const handleImageLoaded = () => {
        setIsLoading(false);
        if (imageSource?.width && imageSource?.height) {
            setMediaDimensions({
                width: imageSource.width,
                height: imageSource.height
            });
        }
    };

    // Handle video loading
    useEffect(() => {
        if (mediaType !== 'video' || !mediaUrl || !videoRef || !active) return;
        
        const loadVideo = async () => {
            try {
                await videoRef.loadAsync({ uri: mediaUrl });
                setIsLoading(false);
                
                if (active) {
                    await videoRef.playAsync();
                }
                
                // Get video dimensions
                const status = await videoRef.getStatusAsync();
                if (status.width && status.height) {
                    setMediaDimensions({
                        width: status.width,
                        height: status.height
                    });
                }
            } catch (error) {
                console.error('Error loading video:', error);
            }
        };
        
        loadVideo();
        
        return () => {
            videoRef.unloadAsync().catch(console.error);
        };
    }, [mediaType, mediaUrl, videoRef, active]);

    // Auto-play when active
    useEffect(() => {
        if (!videoRef || mediaType !== 'video') return;
        
        if (active) {
            videoRef.playAsync().catch(console.error);
        } else {
            videoRef.pauseAsync().catch(console.error);
        }
    }, [active, mediaType, videoRef]);

    // Calculate media style based on dimensions
    const getMediaStyle = (): ImageStyle => {
        const isLandscape = mediaDimensions.width > mediaDimensions.height;
        return {
            width: isLandscape ? screenWidth : undefined,
            height: isLandscape ? undefined : screenHeight,
            flex: isLandscape ? undefined : 1,
        };
    };

    // Render loading state
    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: 'black' }]}>
            {/* Media Content */}
            {mediaType === 'image' && mediaUrl && (
                <Image
                    style={[styles.media, getMediaStyle()]}
                    source={{ uri: mediaUrl }}
                    contentFit="cover"
                    onLoad={handleImageLoaded}
                />
            )}
            
            {mediaType === 'video' && (
                <Video
                    ref={(ref) => setVideoRef(ref)}
                    style={styles.media}
                    resizeMode="cover"
                    shouldPlay={active}
                    isLooping
                />
            )}

            {/* Stickers Layer */}
            <StoryStickersContainer event={story} />

            {/* Header */}
            <View style={styles.headerContainer}>
                <StoryHeader pubkey={story.pubkey} />
            </View>

            {/* Text content at bottom */}
            {story.content && (
                <View style={styles.textContainer}>
                    <StoryText text={story.content} event={story} />
                </View>
            )}

            {/* Touch areas for navigation */}
            <View style={styles.touchContainer}>
                <View style={styles.prevTouch} onTouchEnd={() => onPrev && onPrev()} />
                <View style={styles.nextTouch} onTouchEnd={() => onNext && onNext()} />
            </View>
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