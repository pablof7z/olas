import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';

import { amountInSats, nicelyFormattedSatNumber } from '@/utils/bitcoin';
import { usePaymentStore } from '@/stores/payments';
import { useAppSettingsStore } from '@/stores/app';
import Lightning from '@/components/icons/lightning';
import { useZapperModal } from '@/lib/zapper/hook';
import { useZap } from '@/hooks/zap';


export default function Zaps({ event, inactiveColor, zappedAmount, zappedByUser, iconSize = 18}) {
    const allPending = usePaymentStore(s => s.pendingPayments);
    const pendingZaps = allPending.get(event.tagId()) || [];
    const defaultZap = useAppSettingsStore(s => s.defaultZap);
    const sendZap = useZap();

    const pendingZapAmount = useMemo(() => pendingZaps.reduce((acc, zap) => amountInSats(zap.zapper) + acc, 0), [pendingZaps.length]);

    const sendZapWithAmount = useCallback(async (message: string, amount: number) => {
        await sendZap(message, amount, event);
    }, [event?.id, sendZap]);

    const color = zappedByUser || pendingZapAmount > 0 ? 'orange' : inactiveColor;
    const openZapperModal = useZapperModal();

    const handleLongPress = useCallback(() => {
        openZapperModal(event);
    }, [event, openZapperModal]);

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => sendZapWithAmount(defaultZap.message, defaultZap.amount)}
                onLongPress={handleLongPress}
                style={styles.touchable}>
                <Lightning size={iconSize} stroke={color} strokeWidth={2} fill={(zappedByUser || pendingZapAmount > 0) ? color : 'none'} />
            </Pressable>
            <Text style={[styles.text, { color: inactiveColor }]}>{nicelyFormattedSatNumber(zappedAmount + pendingZapAmount)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    touchable: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    text: {
        fontSize: 14,
        fontWeight: 'semibold',
    }
})