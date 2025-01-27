import { Text } from '@/components/nativewindui/Text';
import { NDKKind, useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import * as User from '@/components/ui/user';
import { Dimensions, View, ScrollView, Platform, TouchableOpacity } from 'react-native';
import RelativeTime from './components/relative-time';
import EventContent from '@/components/ui/event/content';
import EventMediaContainer from '@/components/media/event';
import { Reactions } from '@/components/events/Post/Reactions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { activeEventAtom } from '@/stores/event';
import { useObserver } from '@/hooks/observer';
import { router } from 'expo-router';

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
    const activeEvent = useAtomValue(activeEventAtom);
    const { userProfile } = useUserProfile(activeEvent.pubkey);

    if (!activeEvent) {
        return <Text>No active event</Text>;
    }

    const url = getUrlFromEvent(activeEvent);
    let content = activeEvent.content;

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
    }, [Platform.OS])

    const viewProfile = useCallback(() => {
        router.push(`/profile?pubkey=${activeEvent.pubkey}`);
    }, [activeEvent.pubkey])

    const maxHeight = Math.floor(Dimensions.get('window').height * 0.7);

    return (
        <ScrollView className="flex-1 bg-black" style={style}>
            <View className="flex-1">
                {/* Header with user info */}
                <TouchableOpacity onPress={viewProfile} className="flex-row items-center border-b border-border p-4">
                    <User.Avatar pubkey={activeEvent.pubkey} userProfile={userProfile} imageSize={24} />
                    <View className="ml-3">
                        <User.Name userProfile={userProfile} pubkey={activeEvent.pubkey} className="font-bold text-white" />
                        <Text className="text-sm text-gray-400">
                            <RelativeTime timestamp={activeEvent.created_at} />
                        </Text>
                    </View>
                </TouchableOpacity>

                <ScrollView minimumZoomScale={1} maximumZoomScale={5}>
                    <EventMediaContainer
                        event={activeEvent}
                        maxWidth={Dimensions.get('window').width}
                        maxHeight={maxHeight}
                        muted={false}
                    />
                </ScrollView>

                {/* Content */}
                <View className="p-4 flex-col gap-4" style={{ paddingBottom: insets.bottom * 4 }}>
                    <EventContent event={activeEvent} content={content} className="text-sm text-white" />
                    <Reactions event={activeEvent} foregroundColor='white' mutedColor='white' />
                </View>

            </View>
        </ScrollView>
    );
}
