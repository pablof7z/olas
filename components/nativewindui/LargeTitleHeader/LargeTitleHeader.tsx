import { useRoute } from '@react-navigation/native';
import { useAugmentedRef } from '@rn-primitives/hooks';
import { Portal } from '@rn-primitives/portal';
import { Icon } from '@roninoss/icons';
import { Stack, router } from 'expo-router';
import * as React from 'react';
import { BackHandler, TextInput, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInRight,
    FadeInUp,
    FadeOut,
    FadeOutRight,
    ZoomIn,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
    LargeTitleHeaderProps,
    LargeTitleSearchBarRef,
    NativeStackNavigationSearchBarOptions,
} from './types';

import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';

const SCREEN_OPTIONS = {
    headerShown: false,
};

export function LargeTitleHeader(props: LargeTitleHeaderProps) {
    const insets = useSafeAreaInsets();
    const { colors } = useColorScheme();
    const route = useRoute();
    const id = React.useId();
    const fallbackSearchBarRef = React.useRef<LargeTitleSearchBarRef>(null);

    const [searchValue, setSearchValue] = React.useState('');
    const [showSearchBar, setShowSearchBar] = React.useState(false);

    const augmentedRef = useAugmentedRef({
        ref: props.searchBar?.ref ?? fallbackSearchBarRef,
        methods: {
            focus: () => {
                setShowSearchBar(true);
            },
            blur: () => {
                setShowSearchBar(false);
            },
            setText: (text) => {
                setSearchValue(text);
                props.searchBar?.onChangeText?.(text);
            },
            clearText: () => {
                setSearchValue('');
                props.searchBar?.onChangeText?.('');
            },
        },
    });

    React.useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (showSearchBar) {
                setShowSearchBar(false);
                setSearchValue('');
                props.searchBar?.onChangeText?.('');
                return true;
            }
            return false;
        });

        return () => {
            backHandler.remove();
        };
    }, [showSearchBar]);

    function onBlur() {
        setShowSearchBar(false);
        props.searchBar?.onBlur?.();
    }

    function onChangeText(text: string) {
        setSearchValue(text);
        props.searchBar?.onChangeText?.(text);
    }

    function onSearchBackPress() {
        setShowSearchBar(false);
        setSearchValue('');
        props.searchBar?.onChangeText?.('');
    }

    function onClearText() {
        setSearchValue('');
        props.searchBar?.onChangeText?.('');
        props.searchBar?.onCancelButtonPress?.();
    }

    const isInlined = props.materialPreset === 'inline';
    const canGoBack = router.canGoBack();

    if (props.shown === false) return null;

    return (
        <>
            <Stack.Screen options={Object.assign(props.screen ?? {}, SCREEN_OPTIONS)} />
            {/* Ref is set in View so we can call its methods before the input is mounted */}
            <View ref={augmentedRef as unknown as React.RefObject<View>} />
            <View
                style={{
                    paddingTop: insets.top + 14,
                    backgroundColor: props.backgroundColor ?? colors.background,
                }}
                className={cn(
                    'px-1 shadow-none',
                    props.shadowVisible && 'shadow-xl',
                    isInlined ? 'pb-4' : 'pb-5'
                )}
            >
                <View className="flex-row justify-between px-0.5">
                    <View className="flex-1 flex-row items-center">
                        {props.leftView ? (
                            <View className="flex-row justify-center gap-4 pl-0.5">
                                {props.leftView({
                                    canGoBack,
                                    tintColor: colors.foreground,
                                })}
                            </View>
                        ) : (
                            props.backVisible !== false &&
                            canGoBack && (
                                <Button
                                    size="icon"
                                    variant="plain"
                                    onPress={() => {
                                        router.back();
                                    }}
                                >
                                    <Icon name="arrow-left" size={24} color={colors.foreground} />
                                </Button>
                            )
                        )}
                        {isInlined && (
                            <View className={cn('flex-1', canGoBack ? 'pl-4' : 'pl-3')}>
                                <Text
                                    variant="title1"
                                    numberOfLines={1}
                                    className={props.materialTitleClassName}
                                >
                                    {props.title ?? route.name}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View className="flex-row justify-center gap-3 pr-2">
                        {!!props.searchBar && (
                            <Button
                                onPress={() => {
                                    setShowSearchBar(true);
                                    props.searchBar?.onSearchButtonPress?.();
                                }}
                                size="icon"
                                variant="plain"
                            >
                                <Icon name="magnify" size={24} color={colors.foreground} />
                            </Button>
                        )}
                        {!!props.rightView &&
                            props.rightView({
                                canGoBack,
                                tintColor: colors.foreground,
                            })}
                    </View>
                </View>
                {!isInlined && (
                    <View className="px-3 pt-6">
                        <Text
                            numberOfLines={1}
                            className={cn('text-3xl', props.materialTitleClassName)}
                        >
                            {props.title ?? route.name}
                        </Text>
                    </View>
                )}
            </View>
            {!!props.searchBar && showSearchBar && (
                <Portal name={`large-title:${id}`}>
                    <Animated.View
                        exiting={FadeOut}
                        className="absolute bottom-0 left-0 right-0 top-0"
                    >
                        <View
                            style={{ paddingTop: insets.top + 6 }}
                            className="relative z-50 overflow-hidden bg-background"
                        >
                            <Animated.View
                                entering={customEntering}
                                exiting={customExiting}
                                className="bg-muted/25 absolute bottom-2.5 left-4 right-4 h-14 rounded-full dark:bg-card"
                            />
                            <View className="pb-2.5">
                                <Animated.View
                                    entering={FadeIn}
                                    exiting={FadeOut}
                                    className="h-14 flex-row items-center pl-3.5 pr-5"
                                >
                                    <Animated.View entering={FadeIn} exiting={FadeOut}>
                                        <Button
                                            variant="plain"
                                            size="icon"
                                            onPress={onSearchBackPress}
                                        >
                                            <Icon color={colors.grey} name="arrow-left" size={24} />
                                        </Button>
                                    </Animated.View>
                                    <Animated.View
                                        entering={FadeInRight}
                                        exiting={FadeOutRight}
                                        className="flex-1"
                                    >
                                        <TextInput
                                            autoFocus
                                            placeholder={props.searchBar.placeholder ?? 'Search...'}
                                            className="flex-1 rounded-r-full p-2 text-[17px]"
                                            style={{
                                                color:
                                                    props.searchBar.textColor ?? colors.foreground,
                                            }}
                                            placeholderTextColor={colors.grey2}
                                            onBlur={onBlur}
                                            onFocus={props.searchBar?.onFocus}
                                            value={searchValue}
                                            onChangeText={onChangeText}
                                            autoCapitalize={props.searchBar.autoCapitalize}
                                            keyboardType={searchBarInputTypeToKeyboardType(
                                                props.searchBar.inputType
                                            )}
                                            returnKeyType="search"
                                            blurOnSubmit={props.searchBar.materialBlurOnSubmit}
                                            onSubmitEditing={
                                                props.searchBar.materialOnSubmitEditing
                                            }
                                        />
                                    </Animated.View>

                                    <View className="flex-row items-center gap-3 pr-0.5">
                                        {!!searchValue && (
                                            <Animated.View entering={FadeIn} exiting={FadeOut}>
                                                <Button
                                                    size="icon"
                                                    variant="plain"
                                                    onPress={onClearText}
                                                >
                                                    <Icon
                                                        color={colors.grey2}
                                                        name="close"
                                                        size={24}
                                                    />
                                                </Button>
                                            </Animated.View>
                                        )}
                                        {!!props.searchBar.materialRightView &&
                                            props.searchBar.materialRightView({
                                                canGoBack,
                                                tintColor: colors.foreground,
                                            })}
                                    </View>
                                </Animated.View>
                            </View>
                            {isInlined && (
                                <Animated.View entering={ZoomIn} className="h-px bg-border" />
                            )}
                        </View>
                        <Animated.View entering={FadeInUp} className="flex-1 bg-background ">
                            <View className="bg-muted/25 flex-1 dark:bg-card">
                                {props.searchBar.content}
                            </View>
                        </Animated.View>
                    </Animated.View>
                </Portal>
            )}
        </>
    );
}

function searchBarInputTypeToKeyboardType(
    inputType: NativeStackNavigationSearchBarOptions['inputType']
) {
    switch (inputType) {
        case 'email':
            return 'email-address';
        case 'number':
            return 'numeric';
        case 'phone':
            return 'phone-pad';
        default:
            return 'default';
    }
}

const customEntering = () => {
    'worklet';
    const animations = {
        transform: [{ scale: withTiming(3, { duration: 400 }) }],
    };
    const initialValues = {
        transform: [{ scale: 1 }],
    };
    return {
        initialValues,
        animations,
    };
};
const customExiting = () => {
    'worklet';
    const animations = {
        transform: [{ scale: withTiming(1) }],
        opacity: withTiming(0),
    };
    const initialValues = {
        transform: [{ scale: 3 }],
        opacity: 1,
    };
    return {
        initialValues,
        animations,
    };
};
