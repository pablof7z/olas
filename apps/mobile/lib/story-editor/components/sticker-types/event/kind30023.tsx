import { NDKArticle, NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { View, Text, StyleSheet } from 'react-native';
import { Image, useImage } from 'expo-image';
import { UserProfile } from '@/hooks/user-profile';
import { EventStickerStyle } from './styles';
import { useMemo } from 'react';

export default function EventStickerKind30023({
    event,
    userProfile,
    styles,
}: {
    event: NDKEvent;
    userProfile?: UserProfile;
    styles: EventStickerStyle;
}) {
    const article = useMemo(() => NDKArticle.from(event), [event.id]);
    
    // Calculate reading time based on content
    const readingTime = useMemo(() => calculateReadingTime(article.content), [article.id]);
    
    // Get the first two lines of the summary
    const summaryPreview = article.summary 
        ? article.summary.split('\n').slice(0, 2).join('\n') 
        : undefined;

    const image = useImage({ uri: article.image });

    return (
        <View style={[_styles.outerContainer, styles.container]}>
            <View style={_styles.container}>
                {article.title && (
                    <Text style={[_styles.title, styles.text]} numberOfLines={1}>
                        {article.title}
                    </Text>
                )}

                {image && (
                    <View style={_styles.imageContainer}>
                        <Image source={image} style={_styles.image} contentFit="cover" />
                    </View>
                )}

                {userProfile && styles.author && styles.author.nameStyle && (
                    <View style={_styles.authorContainer}>
                        <Text style={[_styles.author, styles.author.nameStyle]} numberOfLines={1}>
                            By {userProfile.displayName || userProfile.name || 'Anonymous'}
                        </Text>
                    </View>
                )}

                {summaryPreview && (
                    <Text numberOfLines={2} style={_styles.summary}>
                        {summaryPreview}
                    </Text>
                )}

                <View style={_styles.metaContainer}>
                    <Text style={_styles.readingTime}>
                        {readingTime} min read
                    </Text>
                </View>
            </View>
        </View>
    );
}

// Helper to calculate reading time from content
function calculateReadingTime(content?: string): number {
    if (!content) return 1;
    
    // Average reading speed: 200 words per minute
    const words = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(words / 200);
    
    // Minimum reading time of 1 minute
    return Math.max(1, readingTime);
}

const _styles = StyleSheet.create({
    outerContainer: {
        width: '100%',
        overflow: 'hidden',
    },
    container: {
        padding: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    imageContainer: {
        width: '100%',
        height: 160,
        marginBottom: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    authorContainer: {
        marginBottom: 8,
    },
    author: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    summary: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    readingTime: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
}); 