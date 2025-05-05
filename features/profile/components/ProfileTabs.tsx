import ReelIcon from '@/components/icons/reel';
import { useSetAtom } from 'jotai';
import { Grid, ShoppingCart, Wind } from 'lucide-react-native';
import React, { memo } from 'react';
import { Dimensions, type StyleProp, TouchableOpacity, View, type ViewStyle } from 'react-native';

type ProfileTabsProps = {
    view: string;
    setView: (v: string) => void;
    hasProducts: boolean;
    colors: Record<string, string>;
};

const profileContentStyles = {
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
    } as ViewStyle,
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    } as ViewStyle,
};

const ProfileTabs = memo(({ view, setView, hasProducts, colors }: ProfileTabsProps) => {
    const COLUMN_COUNT = hasProducts ? 4 : 3;
    const screenWidth = Dimensions.get('window').width;

    const buttonStyle: StyleProp<ViewStyle> = {
        ...profileContentStyles.button,
        width: screenWidth / COLUMN_COUNT,
    };

    const activeButtonStyle: StyleProp<ViewStyle> = {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    };
    const inactiveButtonStyle: StyleProp<ViewStyle> = {
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    };

    return (
        <View style={profileContentStyles.container}>
            <TouchableOpacity
                style={[buttonStyle, view === 'photos' ? activeButtonStyle : inactiveButtonStyle]}
                onPress={() => setView('photos')}
            >
                <Grid size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
                style={[buttonStyle, view === 'reels' ? activeButtonStyle : inactiveButtonStyle]}
                onPress={() => setView('reels')}
            >
                <ReelIcon
                    width={24}
                    strokeWidth={2}
                    stroke={colors.primary}
                    fill={colors.primary}
                />
            </TouchableOpacity>
            <TouchableOpacity
                style={[buttonStyle, view === 'posts' ? activeButtonStyle : inactiveButtonStyle]}
                onPress={() => setView('posts')}
            >
                <Wind size={24} color={colors.primary} />
            </TouchableOpacity>
            {hasProducts && (
                <TouchableOpacity
                    style={[
                        buttonStyle,
                        view === 'products' ? activeButtonStyle : inactiveButtonStyle,
                    ]}
                    onPress={() => setView('products')}
                >
                    <ShoppingCart size={24} color={colors.primary} />
                </TouchableOpacity>
            )}
        </View>
    );
});

export default ProfileTabs;
