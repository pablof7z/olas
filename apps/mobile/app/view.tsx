import { StyleSheet, Dimensions, View, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { NDKKind, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import * as User from '@/components/ui/user';
import RelativeTime from '@/components/relative-time';
import EventContent from '@/components/ui/event/content';
import EventMediaContainer from '@/components/media/event';
import { Reactions } from '@/components/events/Post/Reactions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { activeEventAtom } from '@/stores/event';
import { router } from 'expo-router';
import { nicelyFormattedSatNumber } from '@/utils/bitcoin';

function getUrlFromEvent(event: NDKEvent) {
    let url = event.tagValue('thumb') || event.tagValue('url') || event.tagValue('u');

    // if this is a kind:1 see if there is a URL in the content that ends with .jpg, .jpeg, .png, .gif, .webp
    if (!url && event.kind === NDKKind.Text) {
        const content = event.content;
        const urlMatch = content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i);
        if (urlMatch) {
            url = urlMatch[0];
        }
    }

    return url;
}

export default function ViewScreen() {
    const activeEvent = useAtomValue<NDKEvent>(activeEventAtom);
    const { userProfile } = useUserProfile(activeEvent.pubkey);

    if (!activeEvent) {
        return <Text style={styles.noActiveEvent}>No active event</Text>;
    }

    const url = getUrlFromEvent(activeEvent);
    let content = activeEvent.content;
    let title = null;
    let price = null;
    let currency = null;

    if (activeEvent.kind === 30018) {
        const parsed = JSON.parse(activeEvent.content);
        title = parsed.name;
        content = parsed.description;
        price = parsed.price;
        currency = parsed.currency;
    }

    // remove url from content
    if (url) {
        content = content.replace(url, '');
    }

    const insets = useSafeAreaInsets(); 
    const style = useMemo(() => {
        const isAndroid = Platform.OS === 'android';
        if (isAndroid) {
            return {
                paddingTop: insets.top,
            }
        }
        return {};
    }, [insets.top]);

    const viewProfile = useCallback(() => {
        router.push(`/profile?pubkey=${activeEvent.pubkey}`);
    }, [activeEvent.pubkey])

    const maxHeight = Math.floor(Dimensions.get('window').height * 0.7);

    return (
        <ScrollView style={[styles.scrollView, style]}>
            <View style={styles.container}>
                <TouchableOpacity onPress={viewProfile} style={styles.header}>
                    <User.Avatar pubkey={activeEvent.pubkey} userProfile={userProfile} imageSize={32} />
                    <View style={styles.userInfo}>
                        <User.Name userProfile={userProfile} pubkey={activeEvent.pubkey} style={styles.userName} />
                        <Text style={styles.timestamp}>
                            <RelativeTime timestamp={activeEvent.created_at} />
                        </Text>
                    </View>
                </TouchableOpacity>

                <ScrollView minimumZoomScale={1} maximumZoomScale={5}>
                    <EventMediaContainer
                        event={activeEvent}
                        contentFit="contain"
                        maxWidth={Dimensions.get('window').width}
                        maxHeight={maxHeight}
                        muted={false}
                    />
                </ScrollView>

                {/* Content */}
                <View style={[styles.contentContainer, { paddingBottom: insets.bottom * 4 }]}>
                    {price && <Text numberOfLines={1} variant="title1" className="text-white">{nicelyFormattedSatNumber(price)} {currency.toLowerCase()}</Text>}
                    {title && <Text numberOfLines={1} variant="title1" className="text-white">{title}</Text>}
                    <EventContent event={activeEvent} content={content} style={styles.eventContent} />
                    <Reactions event={activeEvent} foregroundColor='white' inactiveColor='white' />
                </View>

            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#000',
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#ffffff33',
        padding: 16,
    },
    userInfo: {
        marginLeft: 12,
    },
    userName: {
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    timestamp: {
        fontSize: 12,
        color: '#9CA3AF', // Tailwind 'text-gray-400'
    },
    contentContainer: {
        padding: 16,
        flexDirection: 'column',
        gap: 16,
    },
    eventContent: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    noActiveEvent: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
});
