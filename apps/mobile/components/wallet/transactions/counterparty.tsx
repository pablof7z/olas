import { useUserProfile } from '@nostr-dev-kit/ndk-mobile';
import { View } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import RelativeTime from '@/components/relative-time';

export const Counterparty = ({ pubkey, timestamp, children }: { pubkey: string; timestamp?: number; children?: React.ReactNode }) => {
    const { userProfile } = useUserProfile(pubkey);
    return (
        <View className="flex-col gap-0">
            <Text numberOfLines={1} ellipsizeMode="tail" className="text-lg font-semibold text-foreground">
                {userProfile?.name || userProfile?.displayName}
            </Text>
            {children}
            {timestamp && <RelativeTime className="text-xs text-muted-foreground" timestamp={timestamp} />}
        </View>
    );
};
