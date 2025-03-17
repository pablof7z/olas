import { NDKZapper, useNDKCurrentUser, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import * as Haptics from 'expo-haptics';
import { toast } from '@backpackapp-io/react-native-toast';
import { NDKUser } from '@nostr-dev-kit/ndk-mobile';
import { NDKEvent } from '@nostr-dev-kit/ndk-mobile';
import { NDKCashuWallet, NDKNWCWallet } from '@nostr-dev-kit/ndk-wallet';
import { router } from 'expo-router';
import { addNWCZap } from '@/stores/db/zaps';
import { useCallback, useMemo } from 'react';
import { usePaymentStore } from '@/stores/payments';
import { ZAPS_DISABLED } from '@/utils/const';

export const useZap = () => {
    const currentUser = useNDKCurrentUser();
    const { activeWallet } = useNDKWallet();
    const addPendingPayment = usePaymentStore((s) => s.addPendingPayment);
    const updatePaymentStatus = usePaymentStore((s) => s.updatePaymentStatus);
    const removePayment = usePaymentStore((s) => s.removePayment);
    const withFallbackZap = useMemo(() => {
        return !!(activeWallet instanceof NDKCashuWallet);
    }, [activeWallet?.walletId]);

    const sendZap = useCallback(
        /**
         * @param message
         * @param sats
         * @param target
         * @param delayMs - Amount of time to wait before actually zapping. When called with a delay, a cancel function is returned.
         * @returns
         */
        (message = 'Zap from Olas', sats: number, target: NDKEvent | NDKUser, delayMs = 0) => {
            if (!activeWallet) {
                alert("You don't have a wallet connected yet.");
                router.push('/wallets');
                return;
            }

            const balance = activeWallet.balance;
            const balanceInSats = balance?.amount ?? 0;
            if (balanceInSats < sats) {
                toast.error("You don't have enough balance to zap.");
                return;
            }

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            try {
                const zapper = new NDKZapper(target, Math.round(sats) * 1000, 'msat', {
                    comment: message,
                    nutzapAsFallback: withFallbackZap,
                });

                const pendingPayments = addPendingPayment(zapper, currentUser!.pubkey, delayMs > 0 ? 'delayed' : 'pending');

                if (activeWallet instanceof NDKNWCWallet) {
                    zapper.on('ln_invoice', ({ recipientPubkey, type, pr }) => {
                        let correctPayment = pendingPayments.find((p) => p.recipient === recipientPubkey);
                        if (!correctPayment) {
                            console.log('[ZAP HOOK] Potential bug, looking for correct payment for recipientPubkey', {
                                recipientPubkey,
                                type,
                                pendingPayments,
                            });
                        }
                        correctPayment = correctPayment ?? pendingPayments[0];
                        addNWCZap({ target, recipientPubkey, pr, zapType: type, pendingPaymentId: correctPayment.internalId });
                    });
                }

                if (ZAPS_DISABLED) return;
                if (delayMs > 0) {
                    const timeout = setTimeout(() => {
                        for (const payment of pendingPayments) {
                            updatePaymentStatus(target, payment.internalId, 'pending');
                        }
                        zapper.zap();
                    }, delayMs);
                    return () => {
                        console.log('cancelling zap');
                        for (const payment of pendingPayments) {
                            removePayment(target, payment.internalId);
                        }
                        clearTimeout(timeout);
                    };
                } else {
                    return zapper.zap();
                }
            } catch (error: any) {
                console.error('Error while zapping:', error);
                toast.error(error.message);
            }
        },
        [activeWallet?.walletId, addPendingPayment, removePayment, withFallbackZap]
    );

    return sendZap;
};
