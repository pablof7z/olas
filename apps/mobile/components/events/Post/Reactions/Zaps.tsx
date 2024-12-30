import React, { useState, useRef, useMemo } from 'react';
import { Animated, PanResponder, View, Text, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';
import { nicelyFormattedMilliSatNumber } from '@/utils/bitcoin';
import { NDKKind, NDKNutzap, NDKZapper, useNDKCurrentUser, zapInvoiceFromEvent, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { router } from 'expo-router';

export default function Zaps({ event, zaps, style }) {
    const currentUser = useNDKCurrentUser();
    const { activeWallet } = useNDKWallet();
    const { colors } = useColorScheme();
    const [amount, setAmount] = useState(0);
    const [canceled, setCanceled] = useState(false);
    const amountRef = useRef(0);
    const touchTimer = useRef(null);
    const directionRef = useRef<'up' | 'down' | null>(null);
    const growthFactorRef = useRef(1);

    const { totalZapped, zappedByUser } = useMemo(() => {
        let zappedByUser = false;

        const totalZapped = zaps.reduce((acc, zap) => {
            if (zap.kind === NDKKind.Nutzap) {
                const nutzap = NDKNutzap.from(zap);
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

        return { totalZapped, zappedByUser };
    }, [zaps]);

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
            console.log('up', amountRef.current, factor);
        } else {
            amountRef.current = (amountRef.current + 1) * (-factor * 0.1 + 1);
            console.log('down', amountRef.current, factor);
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
            console.log('counting', growthFactorRef.current);
            amountRef.current = Math.min(10000000, amountRef.current * (growthFactorRef.current + 1));
            setAmount(Math.floor(amountRef.current));
        }, 100);
    };

    const stopCounting = () => {
        console.log('stop counting');
        clearInterval(touchTimer.current);
    };

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
            onPanResponderRelease: (evt, gestureState) => {
                stopCounting(); // Stop timer during movement
                if (!canceled && amountRef.current > 0) {
                    sendZap(amountRef.current);
                }
                setAmount(0);
            },
        })
    ).current;

    const sendZap = async (sats) => {
        if (!activeWallet) {
            alert("You don't have a wallet connected yet.");
            router.push('/wallets');
            return;
        }

        try {
            const zapper = new NDKZapper(event, Math.round(sats) * 1000, 'msat', {
                comment: "🥜 Nutzap from OLAS' nutsack",
            });
            zapper.zap();
            setAmount(0);
        } catch (error) {
            console.error('Error while zapping:', error);
        }
    };

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }} {...panResponder.panHandlers}>
            {/* <View style={{ flexDirection: "row", alignItems: "center" }}> */}
            <TouchableOpacity
                onPress={() => sendZap(1)}
                style={[style, { flexDirection: 'row', alignItems: 'center', position: 'absolute' }]}>
                <Zap size={Math.min(24 + amount * 0.1, 72)} color={zappedByUser || amountRef.current > 0 ? 'orange' : colors.muted} />
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
