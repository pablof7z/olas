import { Hexpubkey, NDKKind, useNDKSession } from "@nostr-dev-kit/ndk-mobile";
import { NDKEvent, useNDK } from "@nostr-dev-kit/ndk-mobile";
import { Button } from "../nativewindui/Button";
import { ButtonProps } from "../nativewindui/Button";
import { Text } from "../nativewindui/Text";
import { useState } from "react";
import { ActivityIndicator } from "react-native";
import { Check } from "lucide-react-native";

export default function FollowButton({ 
    pubkey, 
    variant = "secondary",
    size = "sm",
    ...props
}: { 
    pubkey: Hexpubkey;
    variant?: ButtonProps["variant"];
    size?: ButtonProps["size"];
} & Omit<ButtonProps, "variant" | "size">) {
    const { ndk, currentUser } = useNDK();
    const { follows } = useNDKSession();
    const [enabling, setEnabling] = useState(false);
    
    const follow = async () => {
        const followEvent = new NDKEvent(ndk);
        followEvent.kind = 967;
        followEvent.tags = [
            ['p', pubkey],
            ['k', NDKKind.Image.toString()],
            ['k', NDKKind.VerticalVideo.toString()],
        ];
        await followEvent.sign();

        setEnabling(true);
        setTimeout(async () => {
            setEnabling(false);
        }, 2500);

        const user = await ndk.getUser({ pubkey });
        await currentUser?.follow(user);
    };

    if (follows?.includes(pubkey) || pubkey === currentUser?.pubkey) {
        return null;
    }

    return <Button
        {...props}
        variant={variant}
        size={size}
        onPress={follow}
        disabled={enabling}
    >
        {enabling ? (
            <Check size={18} strokeWidth={2} />
        ) : (
            <Text>Follow</Text>
        )}
    </Button>;
}
