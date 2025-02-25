import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    FadeIn,
    FadeOut,
} from "react-native-reanimated";
import {
    Gesture,
    GestureDetector,
    SimultaneousGesture,
} from "react-native-gesture-handler";
import { useAppSettingsStore } from "@/stores/app";
import Lightning from "@/components/icons/lightning";
import { useZapperModal } from "@/lib/zapper/hook";
import { useZap } from "@/hooks/zap";
import { usePaymentStore } from "@/stores/payments";
import { ZapModal } from "@/components/ZapModal";
import { X } from "lucide-react-native";

export default function Zaps({ event, inactiveColor, iconSize = 18 }) {
    const cancelZapRef = useRef<() => void>(null);
    const paymentEntry = usePaymentStore((s) => s.entries.get(event.tagId()));
    const defaultZap = useAppSettingsStore((s) => s.defaultZap);
    const sendZap = useZap();
    const openZapperModal = useZapperModal();
    const [showCancel, setShowCancel] = useState(false);

    useEffect(() => {
        setShowCancel(false);
    }, [event?.id]);

    const sendZapWithAmount = useCallback(
        async (message: string, amount: number, delayMs = 0) => {
            const ret = sendZap(message, amount, event, delayMs);
            if (delayMs > 0 && !(ret instanceof Promise)) {
                cancelZapRef.current = await ret;
                setShowCancel(true);
                setTimeout(() => setShowCancel(false), 2500);
            }
        },
        [event?.id, sendZap]
    );

    const openZapper = useCallback(() => {
        openZapperModal(event);
    }, [event]);

    const color =
        paymentEntry?.zapCountByCurrentUser > 0 ? "orange" : inactiveColor;
    const handleLongPress = Gesture.LongPress().onStart(() => {
        runOnJS(openZapper)();
    });

    // Local state for modal visibility and explosion trigger.
    const [modalVisible, setModalVisible] = useState(false);
    const [explode, setExplosion] = useState(false);
    const zapAmount = useSharedValue(defaultZap.amount);
    const panOffsetY = useSharedValue(0);
    const yoloZaps = useAppSettingsStore((s) => s.yoloZaps);

    // Shared value for the lightning button’s scale/opacity during panning.
    const buttonIconAnim = useSharedValue(1);
    const buttonIconStyle = useAnimatedStyle(() => ({
        opacity: buttonIconAnim.value,
        transform: [{ scale: buttonIconAnim.value }],
    }));

    const cancelPoint = useMemo(() => {
        const screenHeight = Dimensions.get("window").height;
        return screenHeight * 0.9;
    }, []);

    const abortPanRef = useRef(false);
    const panGesture = Gesture.Pan()
        .onStart(() => {
            abortPanRef.current = false;
            panOffsetY.value = 0;
            // Animate lightning button to shrink while panning.
            buttonIconAnim.value = withSpring(0, {
                damping: 80,
                stiffness: 200,
            });
            runOnJS(setModalVisible)(true);
            runOnJS(setExplosion)(false);
        })
        .onChange((evt) => {
            if (evt.absoluteY > cancelPoint) {
                zapAmount.value = 0;
                // End pan gesture if dragging into cancel area.
                runOnJS(setModalVisible)(false);
                abortPanRef.current = true;
            } else {
                const horizontalFactor = 1;
                const distance = Math.sqrt(
                    evt.changeX * evt.changeX + evt.changeY * evt.changeY
                );
                zapAmount.value = Math.round(
                    Math.max(
                        0,
                        zapAmount.value +
                            Math.pow(distance, 1.2) * horizontalFactor
                    )
                );
            }
            panOffsetY.value = evt.translationY;
        })
        .onEnd(() => {
            // Animate the lightning button back to full size.
            buttonIconAnim.value = withSpring(1, {
                damping: 80,
                stiffness: 200,
            });
            if (zapAmount.value > 0 && !abortPanRef.current) {
                runOnJS(setExplosion)(true);
                runOnJS(sendZapWithAmount)(
                    defaultZap.message,
                    zapAmount.value,
                    4500
                );
            } else {
                runOnJS(setModalVisible)(false);
            }
        });

    const handleSendZap = useCallback(() => {
        if (cancelZapRef.current) {
            cancelZapRef.current();
            cancelZapRef.current = null;
        } else {
            sendZapWithAmount(defaultZap.message, zapAmount.value);
        }
    }, [sendZapWithAmount, zapAmount.value]);

    const handleTap = Gesture.Tap()
        .requireExternalGestureToFail(panGesture)
        .onStart(() => runOnJS(handleSendZap)());

    let gestures: SimultaneousGesture;
    if (yoloZaps) {
        gestures = Gesture.Simultaneous(
            handleLongPress,
            panGesture,
            handleTap
        );
    } else {
        gestures = Gesture.Simultaneous(handleLongPress, handleTap);
    }

    // Reset modal state when explosion animation completes.
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
                <Animated.View
                    key="cancel"
                    entering={FadeIn.duration(500)}
                    exiting={FadeOut.duration(100)}
                >
                    <Pressable onPress={cancel}>
                        <X color={inactiveColor} />
                    </Pressable>
                </Animated.View>
            ) : (
                <GestureDetector gesture={gestures} key="lightning">
                    <Animated.View style={buttonIconStyle}
                        entering={FadeIn.duration(500)}
                        exiting={FadeOut.duration(100)}
                        >
                        <Lightning
                         style={{ transform: [{ rotate: '15deg' }] }}
                            size={iconSize}
                            stroke={color}
                            strokeWidth={2}
                            fill={
                                paymentEntry?.zapCountByCurrentUser > 0
                                    ? color
                                    : "none"
                            }
                        />
                    </Animated.View>
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
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
});
