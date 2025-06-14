import { type NDKUserProfile, useProfileValue } from '@nostr-dev-kit/ndk-mobile';
import { useCallback } from 'react';
import {
    type StyleProp,
    StyleSheet,
    type TextStyle,
    TouchableOpacity,
    type ViewStyle,
} from 'react-native';

import * as User from '@/components/ui/user';
import { useUserFlare } from '@/lib/user/stores/flare';

interface AvatarAndNameProps {
    pubkey: string;
    userProfile?: NDKUserProfile;
    onPress?: () => void;

    imageSize?: number;
    borderColor?: string;
    canSkipBorder?: boolean;

    skipFlare?: boolean;

    nameStyle?: StyleProp<TextStyle>;
    pressableStyle?: StyleProp<ViewStyle>;
}

export default function AvatarAndName({
    pubkey,
    userProfile,
    onPress,
    imageSize,
    borderColor,
    canSkipBorder,
    skipFlare,
    nameStyle,
    pressableStyle,
}: AvatarAndNameProps) {
    // Fetch profile only if userProfile prop is not provided
    const fetchedProfile = useProfileValue(!userProfile ? pubkey : undefined, {
        subOpts: { skipVerification: true },
    });
    // Use provided userProfile prop first, fallback to fetched profile
    const _userProfile = userProfile ?? fetchedProfile;
    const __userProfile = userProfile || _userProfile;
    const flare = useUserFlare(pubkey);
    const displayFlare = skipFlare ? undefined : flare;

    const viewProfile = useCallback(() => {
        if (onPress) {
            onPress();
        }
    }, [onPress]);

    return (
        <TouchableOpacity onPress={viewProfile} style={[styles.container, pressableStyle]}>
            <User.Avatar
                pubkey={pubkey}
                userProfile={__userProfile}
                imageSize={imageSize}
                borderColor={borderColor}
                canSkipBorder={canSkipBorder}
                flare={displayFlare}
            />
            <User.Name
                userProfile={__userProfile}
                pubkey={pubkey}
                style={[styles.userName, nameStyle]}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        marginLeft: 12,
    },
    userName: {
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 12,
    },
});
