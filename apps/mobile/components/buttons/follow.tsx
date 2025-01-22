import { Hexpubkey, NDKKind, useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, useNDK, useNDKCurrentUser, useFollows } from '@nostr-dev-kit/ndk-mobile';
import { Button } from '../nativewindui/Button';
import { ButtonProps } from '../nativewindui/Button';
import { Text } from '../nativewindui/Text';
import { useCallback, useMemo, useState } from 'react';
import { Check } from 'lucide-react-native';

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

    const follow = useCallback(async () => {
        if (!ndk) return;

        const followEvent = new NDKEvent(ndk);
        followEvent.kind = 967;
        followEvent.tags = [
            ['p', pubkey],
            ['k', NDKKind.Image.toString()],
            ['k', NDKKind.VerticalVideo.toString()],
        ];
        setEnabling(pubkey);
        followEvent.publish();

        setTimeout(async () => {
            setEnabling(null);
        }, 10000);
    }, [ndk, setEnabling, pubkey]);

    const isFollowing = useMemo(() => (
        enabling === pubkey || follows?.includes?.(pubkey)
    ), [ pubkey, enabling, follows?.length])

    if (pubkey === currentUser?.pubkey) return null;

    if (enabling !== pubkey && isFollowing) return null;

    return (
        <Button
            variant={variant}
            size={size}
            onPress={follow}
            onLongPress={() => {
                console.log('long press');
            }}
            className="rounded-md"
        >
            {isFollowing ? (
                <Text>Following</Text>
            ) : (
                <Text>Follow</Text>
            )}
        </Button>
    );
}
