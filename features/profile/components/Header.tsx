import BackButton from '@/components/buttons/back-button';
import FollowButton from '@/components/buttons/follow';
import * as User from '@/components/ui/user';
import { useColorScheme } from '@/lib/useColorScheme';
import { prettifyNip05 } from '@/utils/user';
import { X } from 'lucide-react-native';
import type React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedProps,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useProfileEdit from '../hooks/useProfileEdit';
import CopyToClipboard from './CopyToClipboard';

const headerStyles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftContainer: {
        height: 45,
        paddingBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
});

type HeaderProps = {
    user: any;
    pubkey: string;
    userProfile?: any;
    scrollY: SharedValue<number>;
};

const Header: React.FC<HeaderProps> = ({ user, pubkey, userProfile, scrollY }) => {
    const { colors } = useColorScheme();
    const insets = useSafeAreaInsets();
    const bannerHeight = insets.top + headerStyles.leftContainer.height + 50;

    const {
        editState,
        editProfile,
        setEditProfile,
        cancelProfileEdit,
        startProfileEdit,
        saveProfileEdit,
        currentUser,
    } = useProfileEdit(userProfile);

    // Animated props for blur intensity
    const animatedBlurProps = useAnimatedProps(() => {
        return {
            intensity: interpolate(scrollY.value, [0, bannerHeight], [0, 100], Extrapolate.CLAMP),
        };
    });

    // Animated style for username opacity
    const usernameAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, bannerHeight / 2, bannerHeight],
            [0, 0.5, 1],
            Extrapolate.CLAMP
        );
        return { opacity };
    });

    return (
        <Animated.View
            animatedProps={animatedBlurProps as any}
            style={[headerStyles.container, { paddingTop: insets.top }]}
        >
            <View style={headerStyles.leftContainer}>
                {editState === 'edit' ? (
                    <TouchableOpacity
                        onPress={cancelProfileEdit}
                        style={{
                            paddingHorizontal: 10,
                            backgroundColor: '#00000055',
                            borderRadius: 100,
                            width: 40,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginHorizontal: 10,
                        }}
                    >
                        <X size={24} color="white" />
                    </TouchableOpacity>
                ) : (
                    <BackButton />
                )}

                <Animated.View
                    style={[{ flexDirection: 'row', alignItems: 'center' }, usernameAnimatedStyle]}
                >
                    <Pressable onPress={() => {}} style={{ flexDirection: 'column' }}>
                        <User.Name
                            userProfile={editProfile || userProfile}
                            pubkey={pubkey}
                            style={{ color: colors.foreground, fontSize: 20, fontWeight: 'bold' }}
                        />
                        {userProfile?.nip05 && (
                            <Text style={{ color: colors.muted, fontSize: 12 }}>
                                {prettifyNip05(userProfile?.nip05)}
                            </Text>
                        )}
                    </Pressable>
                    <CopyToClipboard text={userProfile?.nip05 || user.npub} size={16} />
                </Animated.View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {currentUser?.pubkey === pubkey && editState && (
                    <TouchableOpacity
                        onPress={saveProfileEdit}
                        style={{
                            paddingHorizontal: 20,
                            backgroundColor: '#00000055',
                            borderRadius: 100,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginHorizontal: 10,
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 14 }}>Save</Text>
                    </TouchableOpacity>
                )}
                {currentUser?.pubkey === pubkey && !editState && (
                    <TouchableOpacity
                        onPress={startProfileEdit}
                        style={{
                            paddingHorizontal: 20,
                            backgroundColor: '#00000055',
                            borderRadius: 100,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginHorizontal: 10,
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 14 }}>Edit</Text>
                    </TouchableOpacity>
                )}
                {currentUser?.pubkey !== pubkey && (
                    <FollowButton variant="secondary" pubkey={pubkey} size="sm" className="mx-4" />
                )}
            </View>
        </Animated.View>
    );
};

export default Header;
