import { NDKUserProfile, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { TouchableOpacity, StyleSheet } from "react-native";
import * as User from "@/components/ui/user";
import { useCallback } from "react";
import { useUserFlare } from "@/hooks/user-flare";

interface AvatarAndNameProps {
    pubkey: string;
    userProfile?: NDKUserProfile;
    onPress?: () => void;

    imageSize?: number;
    borderColor?: string;
    canSkipBorder?: boolean;

    skipFlare?: boolean;
}

export default function AvatarAndName({
    pubkey,
    userProfile,
    onPress,
    imageSize,
    borderColor,
    canSkipBorder,
    skipFlare,
}: AvatarAndNameProps) {
    const { userProfile: _userProfile, user, loading } = useUserProfile(!userProfile ? pubkey : undefined);
    const __userProfile = userProfile || _userProfile;
    const flare = useUserFlare(skipFlare ? undefined : pubkey);

    const viewProfile = useCallback(() => {
        if (onPress) {
            onPress();
        }
    }, [onPress]);


    return (
        <TouchableOpacity onPress={viewProfile} style={styles.container}>
            <User.Avatar pubkey={pubkey} userProfile={__userProfile} imageSize={imageSize} borderColor={borderColor} canSkipBorder={canSkipBorder} flare={flare} />
            <User.Name userProfile={__userProfile} pubkey={pubkey} style={styles.userName} />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    userInfo: {
        marginLeft: 12,
    },
    userName: {
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: 12,
    },
})