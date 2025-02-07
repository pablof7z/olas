import NDK, { Hexpubkey, NDKKind } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, useNDK, useNDKCurrentUser, useFollows } from '@nostr-dev-kit/ndk-mobile';
import { Button } from '../nativewindui/Button';
import { ButtonProps } from '../nativewindui/Button';
import { Text } from '../nativewindui/Text';
import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Check, ChevronDown, Lock } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { useSetAtom } from 'jotai';
import { userBottomSheetAtom } from '@/lib/user-bottom-sheet/store';
import { useFollowType } from '@/hooks/follows';

export function publishFollow(ndk: NDK, pubkey: Hexpubkey) {
    const followEvent = new NDKEvent(ndk);
    followEvent.kind = 967;
    followEvent.tags = [
        ['p', pubkey],
        ['k', NDKKind.Image.toString()],
        ['k', NDKKind.VerticalVideo.toString()],
    ];
    followEvent.publish();

    return followEvent;
}

export default function FollowButton({
    pubkey,
    variant = 'secondary',
    size = 'sm',
    ...props
}: {
    pubkey: Hexpubkey;
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
} & Omit<ButtonProps, 'variant' | 'size'>) {
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const follows = useFollows();
    const [enabling, setEnabling] = useState<Hexpubkey | null>(null);
    const { colors } = useColorScheme();
    const follow = useCallback(async () => {
        if (!ndk) return;
        publishFollow(ndk, pubkey);
        setEnabling(pubkey);

        setTimeout(async () => setEnabling(null), 10000);
    }, [ndk, setEnabling, pubkey]);

    const setUserBottomSheet = useSetAtom(userBottomSheetAtom);

    const handleOpenUserBottomSheet = useCallback(() => {
        setUserBottomSheet(ndk?.getUser({pubkey}));
    }, [ndk, pubkey, setUserBottomSheet]);

    const followStatus = useFollowType(pubkey);

    if (pubkey === currentUser?.pubkey) return null;

    if (!enabling && followStatus === 'public') return null;

    if (!enabling && followStatus === 'private') return (
        <View style={styles.container}>
            <Button variant="plain" size="sm" className="rounded-sm" onPress={handleOpenUserBottomSheet}>
                <Lock size={16} color={colors.muted} />
            </Button>
        </View>
    );

    return (
        <View style={styles.container}>
            <Button
                variant={variant}
                size={size}
                onPress={follow}
                onLongPress={() => {
                    console.log('long press');
                }}
                className="rounded-sm"
            >
                {followStatus === 'private' && <Lock size={16} color={colors.muted} />}
                <Text className="text-sm pr-2">
                    {followStatus ? (
                        "Following"
                    ) : (
                        "Follow"
                    )}
                </Text>
            </Button>
            <Button variant="secondary" size="sm" className="rounded-sm" onPress={handleOpenUserBottomSheet}>
                <ChevronDown size={16} color={colors.muted} />
            </Button>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'center',
        gap: 1
    },
});