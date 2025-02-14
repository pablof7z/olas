import { useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import RelativeTime from "@/app/components/relative-time";

export const Counterparty = ({ pubkey, timestamp }: { pubkey: string, timestamp?: number }) => {
    const { userProfile } = useUserProfile(pubkey);
    return (
        <View className="flex-col gap-0">
            <Text numberOfLines={1} ellipsizeMode="tail" className="text-lg font-medium text-foreground">{userProfile?.name || userProfile?.displayName}</Text>
            {timestamp && <RelativeTime className="text-xs text-muted-foreground" timestamp={timestamp} />}
        </View>
    )
}