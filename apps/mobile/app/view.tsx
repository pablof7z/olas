import {
    type NDKEvent,
    NDKKind,
    NDKUserProfile,
    useSubscribe,
    useProfileValue,
} from '@nostr-dev-kit/ndk-mobile';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, router } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackButton from '@/components/buttons/back-button';
import { Reactions } from '@/components/events/Post/Reactions';
import EventMediaContainer from '@/components/media/event';
import { Text } from '@/components/nativewindui/Text';
import RelativeTime from '@/components/relative-time';
import EventContent from '@/components/ui/event/content';
import * as User from '@/components/ui/user';
import AvatarAndName from '@/components/ui/user/avatar-name';
import { useUserFlare } from '@/hooks/user-flare';
import { activeEventAtom } from '@/stores/event';
import { useReactionsStore } from '@/stores/reactions';
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

function Header({ event }: { event: NDKEvent }) {
    const userProfile = useProfileValue(event.pubkey, { subOpts: { skipVerification: true } });
    const insets = useSafeAreaInsets();
    const _flare = useUserFlare(event.pubkey);

    const viewProfile = useCallback(() => {
        router.push(`/profile?pubkey=${event.pubkey}`);
    }, [event.pubkey]);

    return (
        <View style={[headerStyles.container, { paddingTop: insets.top }]}>
            <BackButton />

            <AvatarAndName
                pubkey={event.pubkey}
                userProfile={userProfile}
                onPress={viewProfile}
                imageSize={24}
                borderColor="black"
                canSkipBorder
                pressableStyle={{ padding: 16 }}
            />

            <Text style={headerStyles.timestamp}>
                <RelativeTime timestamp={event.created_at} />
            </Text>
        </View>
    );
}

const headerStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timestamp: {
        fontSize: 12,
        color: '#9CA3AF', // Tailwind 'text-gray-400'
    },
});

export default function ViewScreen() {
    // Explicitly assert the type from the atom
    const activeEvent = useAtomValue(activeEventAtom) as NDKEvent | null;

    // Handle the case where activeEvent might be null
    if (!activeEvent) {
        // Optionally return a loading indicator or an error message
        return <View><Text>Loading event...</Text></View>;
    }
    const reactions = useReactionsStore((state) => state.reactions.get(activeEvent?.tagId() ?? ''));
    const { events } = useSubscribe(
        activeEvent ? [activeEvent.filter()] : false,
        { groupable: false },
        [activeEvent?.id]
    );

    const height = useHeaderHeight();
    const insets = useSafeAreaInsets();
    const style = useMemo(
        () => ({
            paddingTop: height,
        }),
        [height]
    );

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

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTintColor: 'white',
                    header: () => <Header event={activeEvent} />,
                }}
            />
            <View style={[styles.scrollView, style]}>
                <ScrollView
                    minimumZoomScale={1}
                    maximumZoomScale={5}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flex: 1 }}
                >
                    <EventMediaContainer
                        event={activeEvent}
                        contentFit="contain"
                        maxWidth={Dimensions.get('window').width}
                        maxHeight={Dimensions.get('window').height}
                        muted={false}
                        autoplay
                    />
                </ScrollView>

                {/* Content */}
                <View style={[styles.contentContainer, { paddingBottom: insets.bottom * 2 }]}>
                    {price && (
                        <Text numberOfLines={1} variant="title1" className="text-white">
                            {nicelyFormattedSatNumber(price)} {currency.toLowerCase()}
                        </Text>
                    )}
                    {title && (
                        <Text numberOfLines={1} variant="title1" className="text-white">
                            {title}
                        </Text>
                    )}
                    <EventContent
                        event={activeEvent}
                        content={content}
                        style={styles.eventContent}
                    />
                    <Reactions
                        event={activeEvent}
                        foregroundColor="white"
                        inactiveColor="white"
                        reactions={reactions}
                    />
                </View>
            </View>
        </>
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
