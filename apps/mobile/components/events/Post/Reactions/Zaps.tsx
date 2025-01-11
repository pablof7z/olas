import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Animated, PanResponder, View, Text, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useStore } from 'zustand';
import { useColorScheme } from '@/lib/useColorScheme';
import { nicelyFormattedMilliSatNumber } from '@/utils/bitcoin';
import { NDKKind, NDKNutzap, NDKZapper, useNDKCurrentUser, zapInvoiceFromEvent, useNDKWallet, NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';
import { NDKWallet } from '@nostr-dev-kit/ndk-wallet';
import { toast } from '@backpackapp-io/react-native-toast';
import { usePaymentStore, paymentStore } from '@/stores/payments';

const sendZap = async (sats, event: NDKEvent, wallet: NDKWallet, addPendingPayment) => {
    if (!wallet) {
        alert("You don't have a wallet connected yet.");
        router.push('/wallets');
        return;
    }

    sats = Math.min(sats, 1000);

    try {
        const zapper = new NDKZapper(event, Math.round(sats) * 1000, 'msat', {
            comment: "Zap from Olas",
            tags: [['k', event.kind.toString()]]
        });

        addPendingPayment(zapper);

        await zapper.zap();
    } catch (error) {
        console.error('Error while zapping:', error);
        toast.error(error.message);
    }
}

export default function Zaps({ event, zaps, style, foregroundColor, mutedColor }) {
    const currentUser = useNDKCurrentUser();
    const { activeWallet } = useNDKWallet();
    const { colors } = useColorScheme();
    const [amount, setAmount] = useState(0);
    const [canceled, setCanceled] = useState(false);
    const amountRef = useRef(0);
    const touchTimer = useRef(null);
    const directionRef = useRef<'up' | 'down' | null>(null);
    const growthFactorRef = useRef(1);
    const addPendingPayment = usePaymentStore(s => s.addPendingPayment);
    const allPending = useStore(paymentStore, s => s.pendingPayments);
    const pendingZaps = allPending.get(event.tagId()) || [];

    const { totalZapped, zappedByUser } = useMemo(() => {
        let zappedByUser = false;

        let totalZapped = zaps.reduce((acc, zap) => {
            if (zap.kind === NDKKind.Nutzap) {
                const nutzap = NDKNutzap.from(zap);
                if (!nutzap) {
                    console.log('refusing to parse nutzap', JSON.stringify(zap.rawEvent(), null, 4));
                    return acc;
                }
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


    const updateAmount = (dy) => {
        stopCounting();

        const factor = -(dy / 200);

        // determine the direction
        if (directionRef.current === null) {
            directionRef.current = dy < 0 ? 'up' : 'down';
        } else {
            if (factor > growthFactorRef.current && directionRef.current === 'down') {
                directionRef.current = 'up';
            } else if (factor < growthFactorRef.current && directionRef.current === 'up') {
                directionRef.current = 'down';
            }
        }

        if (directionRef.current === 'up') {
            amountRef.current = (amountRef.current + 1) * (factor * 0.1 + 1);
        } else {
            amountRef.current = (amountRef.current + 1) * (-factor * 0.1 + 1);
        }

        growthFactorRef.current = factor;

        // startCounting();

        // if (dy < 0) {
        //     // Swiping up: Exponential growth
        //     const growthFactor = Math.min(- dy / 2000, 100); // Cap growth to avoid extreme numbers
        //     console.log("growth factor", growthFactor);
        //     growthFactorRef.current = growthFactor;
        //     startCounting();
        //     amountRef.current = dy;
        //     console.log("amount", amountRef.current);
        // } else if (dy > 0) {
        //     // Swiping down: Linear decrease
        //     const growthFactor = Math.max(1 - dy / 200, 0.01); // Cap growth to avoid extreme numbers
        //     growthFactorRef.current = -growthFactor;
        //     amountRef.current = Math.max(0, amountRef.current - dy / 2);
        // }

        setAmount(amountRef.current);

        // Cancel if amount reaches zero
        if (amountRef.current === 0) {
            setCanceled(true);
        }
    };

    const startCounting = () => {
        if (touchTimer.current) {
            clearInterval(touchTimer.current);
        }

        touchTimer.current = setInterval(() => {
            amountRef.current = Math.min(10000000, amountRef.current * (growthFactorRef.current + 1));
            setAmount(Math.floor(amountRef.current));
        }, 100);
    };

    const stopCounting = () => {
        clearInterval(touchTimer.current);
    };

    const sendZapWithAmount = useCallback((amount: number) => {
        sendZap(amount, event, activeWallet, addPendingPayment);
    }, [event?.id, activeWallet?.walletId]);

    const onPanResponderRelease = useCallback((evt, gestureState) => {
        stopCounting(); // Stop timer during movement
        if (!canceled && amountRef.current > 0) {
            sendZap(amountRef.current, event, activeWallet, addPendingPayment);
        }
        setAmount(0);
    }, [event?.id, activeWallet?.walletId]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt, gestureState) => {
                setCanceled(false);
                amountRef.current = 0;
                setAmount(0);
            },
            onPanResponderMove: (evt, gestureState) => {
                updateAmount(gestureState.dy); // Negative dy because upward swipe is negative
            },
            onPanResponderRelease,
        })
    ).current;

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }} {...panResponder.panHandlers}>
            {/* <View style={{ flexDirection: "row", alignItems: "center" }}> */}
            <TouchableOpacity
                onPress={() => sendZapWithAmount(21)}
                style={[style, { flexDirection: 'row', alignItems: 'center', position: 'absolute' }]}>
                <Zap strokeWidth={2} size={Math.min(24 + amount * 0.1, 72)} color={zappedByUser || amountRef.current > 0 ? 'orange' : mutedColor} />
                {amount > 0 ? (
                    <Animated.Text
                        style={{
                            fontSize: Math.min(16 + amount * 0.1, 72),
                            color: colors.foreground,
                            marginLeft: 10,
                        }}>
                        {nicelyFormattedMilliSatNumber(amount * 1000)}
                    </Animated.Text>
                ) : (
                    <Text className="text-sm text-muted-foreground">{nicelyFormattedMilliSatNumber(totalZapped)}</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
