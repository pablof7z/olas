import FollowButton from '@/components/buttons/follow';
import RelativeTime from '@/components/relative-time';
import AvatarGroup from '@/components/ui/user/AvatarGroup';
import { useUserFlare } from '@/hooks/user-flare';
import { getClientName } from '@/utils/event';
import { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { useSetAtom, useAtomValue } from 'jotai';
import { Repeat, MoreHorizontal } from 'lucide-react-native';
import { useCallback } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { optionsMenuEventAtom, optionsSheetRefAtom } from './store';
import * as User from '@/components/ui/user';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';

export function PostHeader({
    event,
    reposts,
    timestamp,
    userProfile,
}: {
    event: NDKEvent;
    reposts: NDKEvent[];
    timestamp: number;
    userProfile: NDKUserProfile | undefined;
}) {
    const flare = useUserFlare(event.pubkey);
    const { colors } = useColorScheme();
    const clientName = getClientName(event);

    const setOptionsMenuEvent = useSetAtom(optionsMenuEventAtom);
    const optionsSheetRef = useAtomValue(optionsSheetRefAtom);

    const openOptionsMenu = useCallback(() => {
        setOptionsMenuEvent(event);
        optionsSheetRef?.current?.present();
    }, [event, optionsSheetRef]);

    return (
        <View style={style.container}>
            {reposts.length > 0 && (
                <View style={style.innerContainer}>
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

            <View style={style.innerContainer}>
                <View style={style.profileContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            router.push(`/profile?pubkey=${event.pubkey}`);
                        }}>
                        <User.Avatar pubkey={event.pubkey} userProfile={userProfile} imageSize={48} borderWidth={2} flare={flare} />
                    </TouchableOpacity>

                    <View className="flex-col">
                        <User.Name userProfile={userProfile} pubkey={event.pubkey} className="font-bold text-foreground" flare={flare} />
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

const style = StyleSheet.create({
    container: {
        flexDirection: 'column',
        paddingHorizontal: 4,
        marginBottom: 10,
    },
    innerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        width: '100%',
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 2,
    },
});
