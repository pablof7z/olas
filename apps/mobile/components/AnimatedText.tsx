import React from 'react';
import {
    type StyleProp,
    StyleSheet,
    TextInput,
    type TextInputProps,
    type TextStyle,
} from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

import { nicelyFormattedSatNumber } from '@/utils/bitcoin';

// Whitelist the native "text" property so it can be animated.
Animated.addWhitelistedNativeProps({ text: true });

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function AnimatedText({
    style,
    text,
}: { style?: StyleProp<TextStyle>; text: SharedValue<number> }) {
    const animatedProps = useAnimatedProps(() => {
        return { text: `${text.value}` } as TextInputProps;
    });

    return (
        <AnimatedTextInput
            underlineColorAndroid="transparent"
            editable={false}
            // Initial value (won't be updated once animatedProps kicks in)
            style={[styles.text, style]}
            animatedProps={animatedProps}
        />
    );
}

const styles = StyleSheet.create({
    text: {
        color: 'black',
        fontVariant: ['tabular-nums'],
    },
});
