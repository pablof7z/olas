import { Hexpubkey, NDKKind, useNDKSession } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent, useNDK, useNDKCurrentUser, useFollows } from '@nostr-dev-kit/ndk-mobile';
import { Button } from '../nativewindui/Button';
import { ButtonProps } from '../nativewindui/Button';
import { Text } from '../nativewindui/Text';
import { useCallback, useState } from 'react';
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
    const [enabling, setEnabling] = useState(false);

    const follow = useCallback(async () => {
        if (!ndk) return;

        const followEvent = new NDKEvent(ndk);
        followEvent.kind = 967;
        followEvent.tags = [
            ['p', pubkey],
            ['k', NDKKind.Image.toString()],
            ['k', NDKKind.VerticalVideo.toString()],
        ];
        await followEvent.sign();
        followEvent.publish();

        setEnabling(true);
        setTimeout(async () => {
            setEnabling(false);
        }, 10000);
    }, [ndk, setEnabling, pubkey]);

    if (follows && (follows?.includes(pubkey) || pubkey === currentUser?.pubkey)) {
        return null;
    }

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
            {enabling ? <Check size={18} strokeWidth={2} /> : <Text>Follow</Text>}
        </Button>
    );
}
