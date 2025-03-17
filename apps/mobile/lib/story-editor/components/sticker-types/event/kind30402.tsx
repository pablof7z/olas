import { NDKClassifiedListing } from '@/lib/product-view';
import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { View, Text, Image, StyleSheet, TextStyle } from 'react-native';
import { UserProfile } from '@/hooks/user-profile';
import { formatMoney } from '@/utils/bitcoin';
import { EventStickerStyle } from './styles';

export default function EventStickerKind30402({
    event,
    userProfile,
    styles,
}: {
    event: NDKEvent;
    userProfile?: UserProfile;
    styles: EventStickerStyle;
}) {
    const classified = NDKClassifiedListing.from(event);

    return (
        <View style={[_styles.outerContainer, styles.container]}>
            <View style={_styles.container}>
                <Text style={[_styles.title, styles.text]} numberOfLines={1}>
                    {classified.title}
                </Text>

                {classified.images?.[0] && (
                    <View style={_styles.imageContainer}>
                        <Image source={{ uri: classified.images[0] }} style={_styles.image} resizeMode="cover" />
                    </View>
                )}

                <View style={_styles.bottomSection}>
                    {classified.price && (
                        <Text style={_styles.price}>
                            {formatMoney({ amount: classified.price.amount, unit: classified.price.currency })}
                        </Text>
                    )}

                    {classified.location && (
                        <View style={_styles.locationContainer}>
                            <Text style={_styles.location}>{classified.location}</Text>
                        </View>
                    )}
                </View>

                {classified.summary && (
                    <Text numberOfLines={2} style={_styles.description}>
                        {classified.summary}
                    </Text>
                )}
            </View>
        </View>
    );
}

const _styles = StyleSheet.create({
    outerContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderRadius: 16,
        marginVertical: 8,
        marginHorizontal: 2,
    },
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        overflow: 'hidden',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#222',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    imageContainer: {
        width: '100%',
        height: 240,
        backgroundColor: '#f8f8f8',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    price: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
    },
    locationContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    location: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    description: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
});
