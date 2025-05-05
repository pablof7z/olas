import { type NDKEvent, type NDKImage, useProfileValue } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import {
    Pressable,
    type StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as User from '@/components/ui/user';

export type StoryHeaderProps = {
    item?: NDKEvent | NDKImage;
    pubkey?: string;
    onClose?: () => void;
    style?: StyleProp<ViewStyle>;
};

export function StoryHeader({ item, pubkey, style, onClose }: StoryHeaderProps) {
    // Get pubkey from item or use direct pubkey
    const userPubkey = item ? item.pubkey : pubkey;
    const userProfile = useProfileValue(pubkey, { subOpts: { skipVerification: true } });
    const insets = useSafeAreaInsets();

    if (!userPubkey) return null;

    return (
        <View style={[styles.container, style, { paddingTop: insets.top }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Pressable
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => router.push(`/profile?pubkey=${userPubkey}`)}
                >
                    <User.Avatar pubkey={userPubkey} userProfile={userProfile} imageSize={32} />
                    <User.Name
                        userProfile={userProfile}
                        pubkey={userPubkey}
                        style={{ color: 'white', marginLeft: 8, fontWeight: '600' }}
                    />
                </Pressable>

                {onClose && (
                    <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
                        <Text style={{ color: 'white', fontSize: 24 }}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginTop: 10,
        left: 0,
        right: 0,
    },
});
