import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { View, Text, Image, StyleSheet } from 'react-native';
import { UserProfile } from '@/hooks/user-profile';
import { EventStickerStyle } from './styles';

// Define the kind number for NDKArticle
const ARTICLE_KIND = 30023;

export default function EventStickerKind30023({
    event,
    userProfile,
    styles,
}: {
    event: NDKEvent;
    userProfile?: UserProfile;
    styles: EventStickerStyle;
}) {
    const article = NDKArticle.from(event);
    
    // Calculate reading time based on content
    const readingTime = calculateReadingTime(article.content);
    
    // Get the first two lines of the summary
    const summaryPreview = article.summary 
        ? article.summary.split('\n').slice(0, 2).join('\n') 
        : undefined;

    return (
        <View style={[_styles.outerContainer, styles.container]}>
            <View style={_styles.container}>
                {article.title && (
                    <Text style={[_styles.title, styles.text]} numberOfLines={1}>
                        {article.title}
                    </Text>
                )}

                {article.image && (
                    <View style={_styles.imageContainer}>
                        <Image source={{ uri: article.image }} style={_styles.image} resizeMode="cover" />
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

// NDKArticle class to handle kind 30023 events
class NDKArticle {
    static kind = ARTICLE_KIND;
    event: NDKEvent;
    
    constructor(event: NDKEvent) {
        this.event = event;
    }
    
    static from(event: NDKEvent): NDKArticle {
        return new NDKArticle(event);
    }
    
    get title(): string | undefined {
        return this.event.tagValue('title');
    }
    
    get image(): string | undefined {
        return this.event.tagValue('image');
    }
    
    get summary(): string | undefined {
        return this.event.tagValue('summary');
    }
    
    get content(): string {
        return this.event.content;
    }
    
    get published_at(): number | undefined {
        const tag = this.event.tagValue('published_at');
        return tag ? parseInt(tag) : undefined;
    }
    
    get author(): string | undefined {
        return this.event.pubkey;
    }
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