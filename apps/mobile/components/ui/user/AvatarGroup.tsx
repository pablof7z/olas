import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import * as User from '../user';
import { Hexpubkey, NDKEvent, useUserProfile } from '@nostr-dev-kit/ndk-mobile';

interface AvatarGroupProps {
    events?: NDKEvent[];
    pubkeys?: Hexpubkey[];
    avatarSize: number;
    threshold: number;
}

const AvatarGroupItem: React.FC<{ pubkey: Hexpubkey; avatarSize: number; index: number }> = ({ pubkey, avatarSize, index }) => {
    const { userProfile } = useUserProfile(pubkey);

    return (
        <User.Avatar
            userProfile={userProfile}
            alt={pubkey}
            size={avatarSize}
            style={{
                height: avatarSize,
                width: avatarSize,
                marginLeft: index > 0 ? -(avatarSize * 1.5) : 0,
            }}
        />
    );
};

/**
 * This component renders a list of avatars that slightly overlap. Useful to show
 * multiple people that have participated in certain event
 */
const AvatarGroup: React.FC<AvatarGroupProps> = ({ events, pubkeys, avatarSize, threshold = 3 }) => {
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
            {sortedPubkeys.slice(0, threshold).map((pubkey, index) => (
                <AvatarGroupItem pubkey={pubkey} avatarSize={avatarSize} index={index} key={pubkey} />
            ))}

            {sortedPubkeys.length > threshold && (
                <View
                    className={`h-${avatarSize} w-${avatarSize} items-center justify-center rounded-full bg-gray-200`}
                    style={{ marginLeft: -10 }}>
                    <Text className="text-sm text-gray-700">+{sortedPubkeys.length - threshold}</Text>
                </View>
            )}
        </View>
    );
};

export default AvatarGroup;
