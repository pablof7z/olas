import { type Hexpubkey, type NDKEvent, useProfileValue } from '@nostr-dev-kit/ndk-mobile';
import type React from 'react';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import * as User from '../user';

interface AvatarGroupProps {
    events?: NDKEvent[];
    pubkeys?: Hexpubkey[];
    avatarSize: number;
    threshold: number;
}

const AvatarGroupItem: React.FC<{ pubkey: Hexpubkey; avatarSize: number; index: number }> = ({
    pubkey,
    avatarSize,
    index,
}) => {
    const userProfile = useProfileValue(pubkey, { skipVerification: true });

    const style = useMemo(() => {
        return {
            height: avatarSize,
            width: avatarSize,
            marginLeft: index > 0 ? -(avatarSize * 1.5) : 0,
        };
    }, [avatarSize, index]);

    return (
        <User.Avatar
            pubkey={pubkey}
            userProfile={userProfile}
            alt={pubkey}
            style={style}
            imageSize={avatarSize}
        />
    );
};

/**
 * This component renders a list of avatars that slightly overlap. Useful to show
 * multiple people that have participated in certain event
 */
const AvatarGroup: React.FC<AvatarGroupProps> = ({
    events,
    pubkeys,
    avatarSize,
    threshold = 3,
}) => {
    const pubkeyCounts = useMemo(() => {
        if (!events) return {};

        const counts: Record<string, number> = {};
        events.forEach((event) => {
            counts[event.pubkey] = (counts[event.pubkey] || 0) + 1;
        });
        return counts;
    }, [events]);

    const sortedPubkeys = useMemo(() => {
        if (pubkeys) return pubkeys;

        return Object.entries(pubkeyCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([pubkey]) => pubkey);
    }, [pubkeyCounts, pubkeys]);

    return (
        <View className="flex flex-row">
            {Array.from(new Set(sortedPubkeys.slice(0, threshold))).map((pubkey, index) => (
                <AvatarGroupItem
                    pubkey={pubkey}
                    avatarSize={avatarSize}
                    index={index}
                    key={pubkey}
                />
            ))}

            {sortedPubkeys.length > threshold && (
                <View>
                    <Text className="text-xs text-gray-700">
                        +{sortedPubkeys.length - threshold}
                    </Text>
                </View>
            )}
        </View>
    );
};

export default AvatarGroup;
