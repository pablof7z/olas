import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { Dimensions, Pressable, StyleSheet, TouchableNativeFeedback } from "react-native";
import { Image } from "expo-image";
import { View, Text } from "react-native";
import * as User from '@/ndk-expo/components/user';
import EventContent from "@/ndk-expo/components/event/content";
import RelativeTime from "@/app/components/relative-time";
import {ResizeMode, Video} from "expo-av";
import { Button } from "../nativewindui/Button";
import { getImageUrl } from '@misaon/imgproxy'
import { TouchableOpacity } from "react-native-gesture-handler";
import { router } from "expo-router";
import { useStore } from "zustand";
import { activeEventStore } from "@/app/stores";
import { imetaFromEvent } from "@/ndk-expo/utils/imeta";
import { useColorScheme } from "@/lib/useColorScheme";
import { useMemo } from "react";
import { useNDK, useSubscribe } from "@/ndk-expo";
import { BookmarkIcon, Heart, MessageCircle } from "lucide-react-native";
import { useNDKSession } from "@/ndk-expo/hooks/session";

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
        { kinds: [NDKKind.Text, 22, NDKKind.Reaction, NDKKind.BookmarkList], ...event.filter() }
    ], [event.id]);
    const opts = useMemo(() => ({ groupable: true }), [])
    const { events: relatedEvents } = useSubscribe({ filters, opts });
    const { colors } = useColorScheme();
    const { setActiveEvent } = useStore(activeEventStore, (state) => state);

    const react = async () => {
        const r = await event.react("+1", false);
        r.tags.push(['k', event.kind.toString()])
        await r.sign();
        console.log('reaction', JSON.stringify(r, null, 2));
        await r.publish();
    }

    const comment = () => {
        setActiveEvent(event);
        router.push(`/comment`);
    }

    const bookmark = async () => {
        alert('Not implemented yet');
    }

    const reactions = useMemo(() => relatedEvents.filter(r => r.kind === NDKKind.Reaction), [relatedEvents]);
    const reactedByUser = useMemo(() => reactions.find(r => r.pubkey === currentUser?.pubkey), [reactions, currentUser?.pubkey]);

    const comments = useMemo(() => relatedEvents.filter(r => [NDKKind.Text, 22].includes(r.kind)), [relatedEvents]);
    const commentedByUser = useMemo(() => comments.find(c => c.pubkey === currentUser?.pubkey), [comments, currentUser?.pubkey]);
    
    return (
        <View className="flex-1 flex-col gap-1 p-2">
            <View className="flex-1 flex-row gap-4 w-full justify-between">
                <View style={{ flex: 1, gap: 10, flexDirection: 'row' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} onPress={react}>
                        <Heart size={24} color={!reactedByUser ? colors.primary : 'red'} />
                    </TouchableOpacity>

                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} onPress={comment}>
                        <MessageCircle size={24} color={!commentedByUser ? colors.primary : 'blue'} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} onPress={bookmark}>
                    <BookmarkIcon size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>
            {reactions.length > 0 && (
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>{reactions.length} reactions</Text>
            )}
        </View>
    );
}

function Kind1Media({ event }: { event: NDKEvent }) {
    // find the urls that are images in the content
    const urls = event.content.match(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/i);

    if (urls.length === 0) return null;

    if (urls.length === 1 || urls.length > 0) {
        const imageUrl = getImageUrl(urls[0], {
            baseURL: 'https://imgproxy.f7z.io', // optional
            secret: '',
            salt: '',
            modifiers: {
                width: Dimensions.get('window').width.toString(),
            }
        })

        return (
            <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="cover"
            />
        );
    }
}

export function CardMedia({ event }: { event: NDKEvent }) {
    const url = event.tagValue('url');

    if (url && isVideo(url)) return <VideoContainer url={url} />

    if (event.kind === NDKKind.Text) {
        return <Kind1Media event={event} />
    }

    if (url) {
        const imeta = imetaFromEvent(event);
        const blurhash = imeta?.blurhash;

        const imageUrl = getImageUrl(url, {
            baseURL: 'https://imgproxy.snort.social', // optional
            secret: 'a82fcf26aa0ccb55dfc6b4bd6a1c90744d3be0f38429f21a8828b43449ce7cebe6bdc2b09a827311bef37b18ce35cb1e6b1c60387a254541afa9e5b4264ae942',
            salt: 'a897770d9abf163de055e9617891214e75a9016d748f8ef865e6ffbcb9ed932295659549773a22a019a5f06d0b440c320be411e3fddfe784e199e4f03d74bd9b',
            modifiers: {
                width: Dimensions.get('window').width.toString(),
            }
        })

        return (
            <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                placeholder={{blurhash}}
                allowDownscaling={true}
                contentPosition="center"
                contentFit="fill"
            />
        );
    }
}

export default function ImageCard({ event }: { event: NDKEvent }) {
    const { setActiveEvent } = useStore(activeEventStore, (state) => state);
    const {colors} = useColorScheme();
    const { currentUser } = useNDK();
    const { follows } = useNDKSession();

    const follow = async () => {
        const f = await currentUser?.follow(event.author);
        console.log('follow', f);
    }

    let content = event.content.trim();
    
    if (event.kind === NDKKind.Text) {
        // remove the urls from the content
        content = content.replace(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp)/g, '');
    }

    return (
        <View
            className="bg-card overflow-hidden py-2 border-b border-gray-200"
        >
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

                {!follows?.includes(event.pubkey) && event.pubkey !== currentUser?.pubkey && (
                    <Button style={{ backgroundColor: colors.grey5 }} onPress={follow}>
                        <Text className="text-primary-secondary">Follow</Text>
                    </Button>
                )}
            </View>
            
            <Pressable onPress={() => {
                setActiveEvent(event);
                router.push('/view');
            }} style={{ flex: 1, flexDirection: 'column', flexGrow: 1, minHeight: 240 }}>
                <CardMedia event={event} />
            </Pressable>

            <Reactions event={event} />

            {event.content.trim().length > 0 && (
                <View className="p-2">
                    <EventContent
                        event={event}
                        content={content}
                        className="text-sm"
                        onMentionPress={(pubkey) => {
                            router.push(`/profile?pubkey=${pubkey}`);
                        }}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        width: Dimensions.get('window').width,
        flex: 1,
        aspectRatio: 1,
    },
    video: {
        width: Dimensions.get('window').width,
        aspectRatio: 1.5,
        minHeight: 240,
        maxHeight: Dimensions.get('window').height - 100,
    }
})