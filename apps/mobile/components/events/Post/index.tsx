import {
    NDKEvent,
    NDKKind,
    useUserProfile,
} from '@nostr-dev-kit/ndk-mobile';
import { Dimensions, Pressable, Share, StyleSheet } from 'react-native';
import { View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import * as User from '@/components/ui/user';
import EventContent from '@/components/ui/event/content';
import RelativeTime from '@/app/components/relative-time';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { useColorScheme } from '@/lib/useColorScheme';
import { memo, useMemo, useCallback, useEffect } from 'react';
import { InlinedComments, Reactions } from './Reactions';
import FollowButton from '@/components/buttons/follow';
import { Text } from '@/components/nativewindui/Text';
import { MoreHorizontal, Repeat } from 'lucide-react-native';
import AvatarGroup from '@/components/ui/user/AvatarGroup';
import EventMediaContainer from '@/components/media/event';
import { optionsMenuEventAtom, optionsSheetRefAtom } from './store';
import { useAtomValue, useSetAtom } from 'jotai';
import { getClientName } from '@/utils/event';
import { useAppSettingsStore } from '@/stores/app';

export const MediaSection = function MediaSection({ event, priority, onPress, maxHeight }: { priority?: 'low' | 'normal' | 'high', event: NDKEvent; onPress?: () => void, maxHeight: number }) {
    return <EventMediaContainer
        event={event}
        onPress={onPress}
        muted={true}
        maxHeight={maxHeight}
        priority={priority}
    />;
};

export default function Post({ event, reposts, timestamp, onPress, index }: { index: number, event: NDKEvent; reposts: NDKEvent[]; timestamp: number; onPress?: () => void }) {
    let content = event.content.trim();

    if (event.kind === NDKKind.Text) {
        // remove the urls from the content
        content = content.replace(/https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp|mp4|mov|avi|mkv)/g, '');
        // replace \n\n\n or more with \n
        content = content.replace(/\n\s*\n\s*\n+/g, '\n');
        // remove from content \n that are after the last word
        content = content.replace(/\n\s*$/g, '');
    }

    const priority = useMemo<('high' | 'normal' | 'low')>(() => {
        if (index === 0) return 'high';
        if (index <= 2) return 'normal';
        return 'low';
    }, [index])

    const { forceSquareAspectRatio } = useAppSettingsStore();

    const headerHeight = useHeaderHeight();
    const screen = Dimensions.get('window');
    const maxHeight = Math.floor(forceSquareAspectRatio ? screen.width * 1.1 : ((screen.height * 0.8) - headerHeight));

    return (
        <View className="overflow-hidden border-b border-border py-2">
            <PostHeader event={event} reposts={reposts} timestamp={timestamp} />

            <MediaSection event={event} onPress={onPress} priority={priority} maxHeight={maxHeight} />

            <PostBottom event={event} trimmedContent={content} />
        </View>
    );
}

export function PostHeader({ event, reposts, timestamp }: { event: NDKEvent; reposts: NDKEvent[]; timestamp: number }) {
    const { userProfile } = useUserProfile(event.pubkey);
    const { colors } = useColorScheme();
    const clientName = getClientName(event);

    const setOptionsMenuEvent = useSetAtom(optionsMenuEventAtom);
    const optionsSheetRef = useAtomValue(optionsSheetRefAtom);

    const openOptionsMenu = useCallback(() => {
        setOptionsMenuEvent(event);
        optionsSheetRef.current?.present();
    }, [event, optionsSheetRef]);

    return (
        <View className="flex-col p-2">
            {reposts.length > 0 && (
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <View className="w-full flex-row items-center justify-between gap-2 pb-0">
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                            <Repeat size={16} color={'green'} />

                            <AvatarGroup pubkeys={reposts.map((r) => r.pubkey)} avatarSize={14} threshold={5} />

                            <Text className="text-xs text-muted-foreground">
                                {'Reposted '}
                                <RelativeTime timestamp={timestamp} />
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <View className="w-full flex-row items-center justify-between gap-2">
                <View style={styles.profileContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            router.push(`/profile?pubkey=${event.pubkey}`);
                        }}>
                        <User.Avatar pubkey={event.pubkey} userProfile={userProfile} imageSize={48} />
                    </TouchableOpacity>

                    <View className="flex-col">
                        <User.Name userProfile={userProfile} pubkey={event.pubkey} className="font-bold text-foreground" />
                        <Text>
                            <RelativeTime timestamp={event.created_at} className="text-xs text-muted-foreground" />
                            {clientName && (
                                <Text className="truncate text-xs text-muted-foreground" numberOfLines={1}>
                                    {` via ${clientName}`}
                                </Text>
                            )}
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <FollowButton pubkey={event.pubkey} />

                    <Pressable onPress={openOptionsMenu}>
                        <MoreHorizontal size={20} color={colors.foreground} />
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const onMentionPress = (pubkey: string) => {
    router.push(`/profile?pubkey=${pubkey}`);
};

function PostBottom({ event, trimmedContent }: { event: NDKEvent; trimmedContent: string }) {
    // const tagsToRender = useMemo(() => {
    //     const tags = new Set(event.getMatchingTags('t').map(t => t[1]));
    //     // remove the tags that are already in the content
    //     tags.forEach(tag => {
    //         if (trimmedContent.match(new RegExp(`#${tag}`, 'i'))) tags.delete(tag);
    //     });
    //     return tags;
    // }, [event.id]);
    
    return (
        <View style={styles.postBottom}>
            <Reactions event={event} />

            {trimmedContent.length > 0 && (
                <EventContent
                    event={event}
                    content={trimmedContent}
                    className="text-sm text-foreground"
                    onMentionPress={onMentionPress}
                />
            )}

            {/* {tagsToRender.size > 0 && (
                <View className="flex-row flex-wrap gap-1">
                    <Text className="text-sm font-bold text-primary">
                        {`${Array.from(tagsToRender).map(t => `#${t}`).join(' ')}`}
                    </Text>
                </View>
            )} */}

            {/* <InlinedComments event={event} /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    postBottom: {
        flex: 1,
        flexDirection: 'column',
        gap: 10,
        padding: 10,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 2,
    },
});
