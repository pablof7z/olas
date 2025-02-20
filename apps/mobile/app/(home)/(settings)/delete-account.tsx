import { Text } from "@/components/nativewindui/Text";
import { NDKEvent, NDKKind, useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-mobile";
import { useCallback, useState } from "react";
import { Button, ButtonState } from "@/components/nativewindui/Button";
import { View } from "react-native";

export default function DeleteAccountScreen() {
    const { ndk, } = useNDK();
    const currentUser = useNDKCurrentUser();
    const [buttonStatus, setButtonStatus] = useState<ButtonState>('idle');

    const deleteAccount = useCallback(async () => {
        setButtonStatus('loading');
        // const event = new NDKEvent(ndk);
        // event.kind = NDKKind.Vanish;
        // event.tags = [["relay", "ALL_RELAYS"]];
        // await event.publish();

        const metadata = new NDKEvent(ndk);
        metadata.kind = NDKKind.Metadata;
        metadata.content = JSON.stringify({
            name: "deleted-account"
        });
        await metadata.publish();
        setButtonStatus('success');
    }, [ndk, currentUser?.pubkey]);
    
    return (
        <View className="flex-1 p-4 flex-col justify-between gap-4">
            <Text variant="title1">Delete Account</Text>

            <Text variant="body" className="text-muted-foreground">
                Are you sure you want to delete your account? This will permanently delete all your content.
                No new content from this account will be accepted.
            </Text>
            <Text variant="body" className="!text-foreground font-bold">There is no way to undo this.</Text>

            <View className="flex-1"></View>

            <Button onPress={deleteAccount} state={buttonStatus} variant="destructive">
                <Text className="py-2 text-white text-lg font-bold">Permanently Delete Account</Text>
            </Button>
        </View>
    )
}