import type { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    withSpring,
    FadeIn,
    FadeOut,
    runOnJS,
    useAnimatedStyle,
} from 'react-native-reanimated';

import { ZapModal } from '@/components/ZapModal';
import Lightning from '@/components/icons/lightning';
import { useZap } from '@/hooks/zap';
import { useZapperModal } from '@/lib/zapper/hook';
import { useAppSettingsStore } from '@/stores/app';
import { usePaymentStore } from '@/stores/payments';

export default function Zaps({
    event,
    inactiveColor,
    iconSize = 18,
    growthFactor,
}: {
    event?: NDKEvent;
    inactiveColor: string;
    iconSize?: number;
    growthFactor?: number;
}) {
    const cancelZapRef = useRef<() => undefined | null>(null);
    const paymentEntry = usePaymentStore((s) => s.entries.get(event?.tagId() ?? ''));
    const defaultZap = useAppSettingsStore((s) => s.defaultZap);
    const sendZap = useZap();
    const openZapperModal = useZapperModal();
    const [showCancel, setShowCancel] = useState(false);
    const [gestureEnded, setGestureEnded] = useState(false);

    const zapAmount = useSharedValue(defaultZap.amount);
    const panOffsetY = useSharedValue(0);
    const buttonIconAnim = useSharedValue(1);
    const abortPanRef = useRef(false);

    const yoloZaps = useAppSettingsStore((s) => s.yoloZaps);
    const yoloZapsGrowthFactor = useAppSettingsStore((s) => s.yoloZapsGrowthFactor);

    growthFactor ??= yoloZapsGrowthFactor;

    useEffect(() => {
        setShowCancel(false);
        setGestureEnded(false);
    }, [event?.id]);

    const sendZapWithAmount = useCallback(
        async (message: string, amount: number, delayMs = 0) => {
            if (!event) return;
            try {
                const ret = sendZap(message, amount, event, delayMs);
                if (delayMs > 0 && !(ret instanceof Promise)) {
                    cancelZapRef.current = await ret;
                    setShowCancel(true);
                    setTimeout(() => setShowCancel(false), 2500);
                }
            } catch (error) {
                console.error('Error in sendZapWithAmount:', error);
            }
        },
        [event?.id, sendZap]
    );

    useEffect(() => {
        if (gestureEnded) {
            if (!abortPanRef.current) {
                const amount = zapAmount.value;
                if (amount > 0) {
                    setExplosion(true);
                    sendZapWithAmount(defaultZap.message, amount, 4500);
                } else {
                    setModalVisible(false);
                }
            }
            setGestureEnded(false);
        }
    }, [gestureEnded, zapAmount, sendZapWithAmount]);

    const openZapper = useCallback(() => {
        if (!event) return;
        openZapperModal(event);
    }, [event?.id]);

    const color = paymentEntry && paymentEntry.zapCountByCurrentUser > 0 ? 'orange' : inactiveColor;
    const [modalVisible, setModalVisible] = useState(false);
    const [explode, setExplosion] = useState(false);

    const buttonIconStyle = useAnimatedStyle(() => ({
        opacity: buttonIconAnim.value,
        transform: [{ scale: buttonIconAnim.value }],
    }));

    const cancelPoint = useMemo(() => Dimensions.get('window').height * 0.9, []);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            zapAmount.value = 1;
            abortPanRef.current = false;
            panOffsetY.value = 0;
            buttonIconAnim.value = withSpring(0, { damping: 80, stiffness: 200 });
            runOnJS(setModalVisible)(true);
            runOnJS(setExplosion)(false);
        })
        .onChange((evt) => {
            if (evt.absoluteY > cancelPoint) {
                zapAmount.value = 0;
                runOnJS(setModalVisible)(false);
                abortPanRef.current = true;
            } else {
                const distance = Math.sqrt(evt.changeY * evt.changeY);
                let newVal: number;
                newVal = zapAmount.value;

                const absX = Math.abs(evt.changeX);
                const absY = Math.abs(evt.changeY);

                const isHorizontal = absX > absY / 2;

                if (isHorizontal) {
                    newVal -= absX ** growthFactor;
                } else {
                    newVal += distance ** growthFactor;
                    newVal += absX;
                }

                zapAmount.value = Math.round(Math.max(1, newVal));
            }
            panOffsetY.value = evt.translationY;
        })
        .onEnd(() => {
            buttonIconAnim.value = withSpring(1, { damping: 80, stiffness: 200 });
            runOnJS(setGestureEnded)(true);
        });

    const handleSendZap = useCallback(() => {
        if (cancelZapRef.current) {
            cancelZapRef.current();
            cancelZapRef.current = null;
        } else {
            sendZapWithAmount(defaultZap.message, zapAmount.value);
        }
    }, [sendZapWithAmount]);

    const handleLongPress = Gesture.LongPress().onStart(() => {
        runOnJS(openZapper)();
    });

    const handleTap = Gesture.Tap()
        .requireExternalGestureToFail(panGesture)
        .onStart(() => runOnJS(handleSendZap)());

    const gestures = yoloZaps
        ? Gesture.Simultaneous(handleLongPress, panGesture, handleTap)
        : Gesture.Simultaneous(handleLongPress, handleTap);

    const onModalDismiss = useCallback(() => {
        setModalVisible(false);
        setExplosion(false);
        zapAmount.value = defaultZap.amount;
    }, [zapAmount, defaultZap.amount]);

    const cancel = useCallback(() => {
        if (cancelZapRef.current) {
            cancelZapRef.current();
            cancelZapRef.current = null;
        }
        setShowCancel(false);
    }, []);

    return (
        <View style={styles.container}>
            {showCancel ? (
                <View>
                    <Pressable onPress={cancel}>
                        <X color={inactiveColor} />
                    </Pressable>
                </View>
            ) : (
                <GestureDetector gesture={gestures} key="lightning">
                    <View style={buttonIconStyle}>
                        <Lightning
                            style={{ transform: [{ rotate: '15deg' }] }}
                            size={iconSize}
                            stroke={color}
                            strokeWidth={2}
                            fill={paymentEntry?.zapCountByCurrentUser > 0 ? color : 'none'}
                        />
                    </View>
                </GestureDetector>
            )}
            {modalVisible && (
                <ZapModal
                    visible={modalVisible}
                    explode={explode}
                    zapAmount={zapAmount}
                    defaultZapAmount={defaultZap.amount}
                    onDismiss={onModalDismiss}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
});
