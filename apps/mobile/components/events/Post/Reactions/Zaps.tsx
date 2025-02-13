import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { amountInSats, nicelyFormattedMilliSatNumber, nicelyFormattedSatNumber } from '@/utils/bitcoin';
import { NDKZapper, useNDKWallet, NDKEvent, NDKNutzap } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { NDKCashuWallet, NDKNWCWallet, NDKWallet } from '@nostr-dev-kit/ndk-wallet';
import { toast } from '@backpackapp-io/react-native-toast';
import { usePaymentStore } from '@/stores/payments';
import { useAppSettingsStore } from '@/stores/app';
import Lightning from '@/components/icons/lightning';
import { addNWCZap } from '@/stores/db/zaps';

export const sendZap = async (message = 'Zap from Olas', sats: number, event: NDKEvent, wallet: NDKWallet, addPendingPayment, withFallbackZap: boolean) => {
    if (!wallet) {
        alert("You don't have a wallet connected yet.");
        router.push('/wallets');
        return;
    }

    const balance = wallet.balance();
    const balanceInSats = balance.amount;
    if (balanceInSats < sats) {
        toast.error("You don't have enough balance to zap.");
        return;
    }
    
    sats = Math.min(sats, 5000);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
        const zapper = new NDKZapper(event, Math.round(sats) * 1000, 'msat', {
            comment: message,
            nutzapAsFallback: withFallbackZap,
        });

        const pendingPayment = addPendingPayment(zapper);

        if (wallet instanceof NDKNWCWallet) {
            zapper.on('ln_invoice', ({ recipientPubkey, type, pr }) => {
                addNWCZap({ event, recipientPubkey, pr, zapType: type, pendingPaymentId: pendingPayment.internalId });
            })
        }

        await zapper.zap();
    } catch (error: any) {
        console.error('Error while zapping:', error);
        toast.error(error.message);
    }
}

export default function Zaps({ event, inactiveColor, zappedAmount, zappedByUser, iconSize = 24}) {
    const { activeWallet } = useNDKWallet();
    const addPendingPayment = usePaymentStore(s => s.addPendingPayment);
    const allPending = usePaymentStore(s => s.pendingPayments);
    const pendingZaps = allPending.get(event.tagId()) || [];
    const defaultZap = useAppSettingsStore(s => s.defaultZap);

    const withFallbackZap = useMemo(() => {
        return !!(activeWallet instanceof NDKCashuWallet);
    }, [activeWallet?.walletId]);

    const pendingZapAmount = useMemo(() => pendingZaps.reduce((acc, zap) => amountInSats(zap.zapper) + acc, 0), [pendingZaps.length]);

    const sendZapWithAmount = useCallback(async (message: string, amount: number) => {
        await sendZap(message, amount, event, activeWallet, addPendingPayment, withFallbackZap);
    }, [event?.id, activeWallet?.walletId, withFallbackZap]);

    const color = zappedByUser || pendingZapAmount > 0 ? 'orange' : inactiveColor;

    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => sendZapWithAmount(defaultZap.message, defaultZap.amount)}
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