import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Lightning from '@/components/icons/lightning';
import { nicelyFormattedMilliSatNumber } from '@/utils/bitcoin';
import { NDKKind, NDKNutzap, NDKZapper, zapInvoiceFromEvent, useNDKWallet, NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { NDKCashuWallet, NDKWallet } from '@nostr-dev-kit/ndk-wallet';
import { toast } from '@backpackapp-io/react-native-toast';
import { usePaymentStore } from '@/stores/payments';
import { useAppSettingsStore } from '@/stores/app';

const sendZap = async (message = 'Zap from Olas', sats: number, event: NDKEvent, wallet: NDKWallet, addPendingPayment, withFallbackZap: boolean) => {
    if (!wallet) {
        alert("You don't have a wallet connected yet.");
        router.push('/wallets');
        return;
    }

    sats = Math.min(sats, 5000);

    try {
        const zapper = new NDKZapper(event, Math.round(sats) * 1000, 'msat', {
            comment: message,
            // tags: [['k', event.kind.toString()]],
            nutzapAsFallback: withFallbackZap,
        });

        addPendingPayment(zapper);

        await zapper.zap();
    } catch (error: any) {
        console.error('Error while zapping:', error);
        toast.error(error.message);
    }
}

export default function Zaps({ event, style, mutedColor, currentUser, zaps }) {
    const { activeWallet } = useNDKWallet();
    const amountRef = useRef(0);
    const addPendingPayment = usePaymentStore(s => s.addPendingPayment);
    const allPending = usePaymentStore(s => s.pendingPayments);
    const pendingZaps = allPending.get(event.tagId()) || [];
    const defaultZap = useAppSettingsStore(s => s.defaultZap);

    const withFallbackZap = useMemo(() => {
        return !!(activeWallet instanceof NDKCashuWallet);
    }, [activeWallet?.walletId]);
    
    const { totalZapped, zappedByUser } = useMemo(() => {
        let zappedByUser = false;

        let totalZapped = zaps.reduce((acc, zap) => {
            if (zap.kind === NDKKind.Nutzap) {
                const nutzap = NDKNutzap.from(zap);
                if (!nutzap) return acc;
                if (nutzap.pubkey === currentUser?.pubkey) {
                    zappedByUser = true;
                }
                let amountInMilliSats = nutzap.amount;

                if (nutzap.unit.startsWith('sat')) {
                    amountInMilliSats = nutzap.amount * 1000;
                }

                return acc + amountInMilliSats;
            } else {
                const invoice = zapInvoiceFromEvent(zap);
                if (invoice.zappee === currentUser?.pubkey) {
                    zappedByUser = true;
                }
                return acc + invoice.amount;
            }
        }, 0);

        if (pendingZaps.length > 0) {
            zappedByUser = true;
            pendingZaps.forEach(pending => {
                let amountInMilliSats = pending.zapper.amount;
                if (pending.zapper.unit.startsWith('sat')) 
                    amountInMilliSats = pending.zapper.amount * 1000;
                totalZapped += amountInMilliSats;
            })
        }

        return { totalZapped, zappedByUser, pendingZaps };
    }, [zaps, pendingZaps.length]);

    const sendZapWithAmount = useCallback((message: string, amount: number) => {
        sendZap(message, amount, event, activeWallet, addPendingPayment, withFallbackZap);
    }, [event?.id, activeWallet?.walletId, withFallbackZap]);

    const color = zappedByUser || amountRef.current > 0 ? 'orange' : mutedColor;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => sendZapWithAmount(defaultZap.message, defaultZap.amount)}
                style={[style, styles.touchable]}>
                <Lightning strokeWidth={2} size={32} stroke={color} />
                <Text className="text-sm text-muted-foreground">{nicelyFormattedMilliSatNumber(totalZapped)}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    touchable: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
    }
})