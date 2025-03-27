import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    interpolate,
    Extrapolate,
    runOnJS,
    useDerivedValue,
} from 'react-native-reanimated';

import { AnimatedText } from './AnimatedText';

import Lightning from '@/components/icons/lightning';

interface ZapModalProps {
    visible: boolean;
    explode: boolean;
    zapAmount: Animated.SharedValue<number>;
    defaultZapAmount: number;
    onDismiss: () => void;
}

export function ZapModal({ visible, explode, zapAmount, defaultZapAmount, onDismiss }: ZapModalProps) {
    const baseIconSize = 100;

    // Normal transition progress when modal appears.
    const transitionProgress = useSharedValue(0);
    // Explosion animation progress.
    const explosionProgress = useSharedValue(0);
    // Flag indicating explosion mode.
    const shouldExplode = useSharedValue(0);
    // Frozen values to capture the current background opacity and icon size.
    const frozenBackgroundOpacity = useSharedValue(0);
    const frozenBaseSize = useSharedValue(baseIconSize);
    const frozenRotation = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            explosionProgress.value = 0;
            transitionProgress.value = 0;
        }
    }, [visible]);

    useEffect(() => {
        if (visible && !explode) {
            transitionProgress.value = withTiming(1, {
                duration: 300,
                easing: Easing.out(Easing.quad),
            });
        }
    }, [visible, explode]);

    useEffect(() => {
        shouldExplode.value = explode ? 1 : 0;
        if (explode) {
            const diff = zapAmount.value - defaultZapAmount;
            const currentBgOpacity = transitionProgress.value * interpolate(diff, [0, 1000], [0.3, 0.9], Extrapolate.CLAMP);
            frozenBackgroundOpacity.value = currentBgOpacity;
            const growth = Math.max(0, (zapAmount.value - defaultZapAmount) / 1000);
            const currentSize = baseIconSize * (1 + transitionProgress.value * 0.2 + growth);
            frozenBaseSize.value = currentSize;
            const currentRotation = Math.min((diff / 1000) * 15, 15);
            frozenRotation.value = currentRotation;
            explosionProgress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }, () => {
                runOnJS(onDismiss)();
            });
        }
    }, [explode]);

    const animatedIconSize = useDerivedValue(() => {
        const growth = Math.max(0, (zapAmount.value - defaultZapAmount) / 1000);
        if (shouldExplode.value === 1) {
            return frozenBaseSize.value * (1 + explosionProgress.value * 50);
        } else {
            return baseIconSize * (1 + transitionProgress.value * 0.2 + growth);
        }
    });

    const animatedBackgroundStyle = useAnimatedStyle(() => {
        const diff = zapAmount.value - defaultZapAmount;
        const computedOpacity = transitionProgress.value * interpolate(diff, [0, 1000], [0.3, 0.9], Extrapolate.CLAMP);
        return {
            opacity: shouldExplode.value === 1 ? frozenBackgroundOpacity.value * (1 - explosionProgress.value) : computedOpacity,
        };
    });

    const animatedIconContainerStyle = useAnimatedStyle(() => {
        let rotation = 0;
        if (shouldExplode.value === 1) {
            rotation = frozenRotation.value + (15 - frozenRotation.value) * explosionProgress.value;
        } else {
            const diff = zapAmount.value - defaultZapAmount;
            rotation = Math.min((diff / 1000) * 15, 15);
        }
        return {
            opacity: shouldExplode.value === 1 ? 1 - explosionProgress.value : 1,
            transform: [{ rotate: `${rotation}deg` }],
        };
    });

    return (
        <Modal transparent visible={visible} animationType="none">
            <Animated.View style={[styles.overlay, animatedBackgroundStyle]}>
                <Animated.View style={animatedIconContainerStyle}>
                    <Lightning animatedSize={animatedIconSize} stroke="orange" strokeWidth={2} fill="orange" />
                </Animated.View>
                <Animated.View style={styles.counterContainer}>
                    <AnimatedText style={styles.counter} text={zapAmount} />
                    <Text style={styles.sats}>sats</Text>
                </Animated.View>
                <Animated.View style={styles.cancelZone}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counter: {
        fontWeight: '800',
        color: 'white',
        fontSize: 96,
    },
    sats: {
        color: 'white',
        fontSize: 18,
        fontWeight: '300',
    },
    counterContainer: {
        position: 'absolute',
        bottom: 100,
        flexDirection: 'column',
        alignItems: 'center',
    },
    cancelZone: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100009999,
        height: 100,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 2,
        backgroundColor: '#000000',
    },
    cancelText: {
        color: 'orange',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
