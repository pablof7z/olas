import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { View, Text } from "react-native";
import * as User from '@/ndk-expo/components/user';
import EventContent from "@/ndk-expo/components/event/content";
import RelativeTime from "@/app/components/relative-time";
import {Video} from "expo-av";
import { Button } from "../nativewindui/Button";
import { useEvent } from "react-native-reanimated";
import { TouchableOpacity } from "react-native-gesture-handler";
import { router } from "expo-router";
import { useStore } from "zustand";
import { activeEventStore } from "@/app/stores";
import { imetaFromEvent } from "@/ndk-expo/utils/imeta";
import { useColorScheme } from "@/lib/useColorScheme";
import { useMemo } from "react";
import { useNDK, useSubscribe } from "@/ndk-expo";
import { Heart } from "lucide-react-native";

const isVideo = (url: string) => {
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
}

export function VideoContainer({ url }: { url: string }) {
    return (
        <Video
            style={styles.video}
            source={{ uri: url }}
        />
    );
}

export function Reactions({ event }: { event: NDKEvent }) {
    const { currentUser } = useNDK();
    const filters = useMemo(() => [
        { kinds: [NDKKind.Reaction], ...event.filter() }
    ], [event.id]);
    const opts = useMemo(() => ({ groupable: true }), [])
    const { events: reactions } = useSubscribe({ filters, opts });
    const { colors } = useColorScheme();

    const react = async () => {
        const r = await event.react("+1", false);
        r.tags.push(['k', event.kind.toString()])
        await r.sign();
        console.log('reaction', JSON.stringify(r, null, 2));
        await r.publish();
    }

    const reactedByUser = useMemo(() => {
        return reactions.find(r => r.pubkey === currentUser?.pubkey);
    }, [reactions, currentUser?.pubkey]);
    
    return (
        <View className="flex-1 gap-4 p-2 w-full justify-between">
            <View style={{ flex: 1, gap: 4, padding: 10 }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={react}>
                    <Heart size={24} color={!reactedByUser ? colors.primary : 'red'} />
                    {reactions.length > 0 && (
                        <Text className="text-base" style={{ color: colors.primary }}>{reactions.length}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function ImageCard({ event }: { event: NDKEvent }) {
    const url = event.tagValue('url');
    const { setActiveEvent } = useStore(activeEventStore, (state) => state);

    if (!url) {
        return null;
    }

    const imeta = imetaFromEvent(event);
    const blurhash = imeta?.blurhash;
    const {colors} = useColorScheme();

    return (
        <View className="bg-card overflow-hidden py-2 border-b border-gray-200">
            <View className="flex-row justify-between items-center gap-2 p-2 w-full">
                <View className="flex-row items-center gap-2 p-2">
                    <User.Profile pubkey={event.pubkey}>
                        <TouchableOpacity onPress={() => {
                            router.push(`/profile?pubkey=${event.pubkey}`);
                        }}>
                            <User.Avatar alt={event.pubkey} />
                        </TouchableOpacity>

                        <View className="flex-col">
                            <User.Name />
                            <RelativeTime timestamp={event.created_at} className="text-xs text-muted-foreground" />
                        </View>
                    </User.Profile>

                </View>

                <Button style={{ backgroundColor: colors.grey5 }}>
                    <Text className="text-primary-secondary">Follow</Text>
                </Button>
            </View>
            
            <TouchableOpacity onPress={() => {
                setActiveEvent(event);
                router.push('/view');
            }}>
                {isVideo(url) ? (
                    <VideoContainer url={url} />
                ) : (
                    <Image
                        source={{ uri: url }}
                        style={styles.image}
                        placeholder={{blurhash}}
                        allowDownscaling={true}
                        contentPosition="center"
                    />
                )}
            </TouchableOpacity>

            <Reactions event={event} />

            {event.content.trim().length > 0 && (
                <View className="p-2">
                    <EventContent event={event} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        width: Dimensions.get('window').width,
        minHeight: 240,
        objectFit: 'cover',
    },
    video: {
        width: Dimensions.get('window').width,
        flex: 1,
        height: Dimensions.get('window').height - 100,
    }
})