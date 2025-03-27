import { type NDKEvent, NDKImage } from '@nostr-dev-kit/ndk-mobile';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { EventStickerStyle } from './styles';

import type { UserProfile } from '@/hooks/user-profile';

export default function EventStickerKind20({
    event,
    userProfile,
    styles,
}: {
    event: NDKEvent;
    userProfile?: UserProfile;
    styles: EventStickerStyle;
}) {
    const ndkImage = useMemo(() => NDKImage.from(event), [event]);

    const createdAt = useMemo(() => {
        if (!event.created_at) return '';

        const date = new Date(event.created_at * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    }, [event.created_at]);

    // Get images from imetas
    const hasImages = ndkImage.imetas && ndkImage.imetas.length > 0;

    return (
        <View style={[_styles.outerContainer, styles.container]}>
            <View style={_styles.container}>
                {hasImages && (
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={_styles.carousel}
                    >
                        {ndkImage.imetas.map((imeta, index) => (
                            <View key={index} style={_styles.imageContainer}>
                                <Image
                                    source={{ uri: imeta.url }}
                                    style={_styles.image}
                                    contentFit="cover"
                                />
                            </View>
                        ))}
                    </ScrollView>
                )}

                {ndkImage.content && (
                    <Text style={[_styles.description, styles.text]} numberOfLines={3}>
                        {ndkImage.content}
                    </Text>
                )}

                <View style={_styles.footer}>
                    <View style={_styles.userContainer}>
                        {userProfile?.picture && (
                            <Image
                                source={{ uri: userProfile.picture }}
                                style={_styles.avatar}
                                contentFit="cover"
                            />
                        )}
                        <Text style={[_styles.username, styles.author?.nameStyle]}>
                            {userProfile?.displayName || userProfile?.name || 'Anonymous'}
                        </Text>
                    </View>

                    <Text style={_styles.timestamp}>{createdAt}</Text>
                </View>
            </View>
        </View>
    );
}

const _styles = StyleSheet.create({
    outerContainer: {
        width: '100%',
        overflow: 'hidden',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    container: {
        padding: 0,
    },
    carouseel: {
        width: '100%',
        height: 240,
    },
    imageContainer: {
        width: 300, // Fixed width for carousel items
        height: 240,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    description: {
        fontSize: 16,
        lineHeight: 22,
        color: '#333',
        padding: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    username: {
        fontSize: 14,
        fontWeight: '500',
        color: '#555',
    },
    timestamp: {
        fontSize: 12,
        color: '#888',
    },
});
