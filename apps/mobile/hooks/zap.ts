import { NDKZapper, useNDKWallet } from "@nostr-dev-kit/ndk-mobile";
import * as Haptics from 'expo-haptics';
import { toast } from "@backpackapp-io/react-native-toast";
import { NDKUser } from "@nostr-dev-kit/ndk-mobile";
import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuWallet, NDKNWCWallet } from "@nostr-dev-kit/ndk-wallet";
import { router } from "expo-router";
import { addNWCZap } from "@/stores/db/zaps";
import { useCallback, useMemo } from "react";
import { usePaymentStore } from "@/stores/payments";

export const useZap = () => {
    const { activeWallet } = useNDKWallet();
    const addPendingPayment = usePaymentStore(s => s.addPendingPayment);
    const withFallbackZap = useMemo(() => {
        return !!(activeWallet instanceof NDKCashuWallet);
    }, [activeWallet?.walletId]);

    const sendZap = useCallback(
        async (message = 'Zap from Olas', sats: number, target: NDKEvent | NDKUser) => {
            if (!activeWallet) {
                alert("You don't have a wallet connected yet.");
                router.push('/wallets');
                return;
            }

            const balance = activeWallet.balance();
            const balanceInSats = balance.amount;
            if (balanceInSats < sats) {
                toast.error("You don't have enough balance to zap.");
                return;
            }
            
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            try {
                const zapper = new NDKZapper(target, Math.round(sats) * 1000, 'msat', {
                    comment: message,
                    nutzapAsFallback: withFallbackZap,
                });

                const pendingPayment = addPendingPayment(zapper);

                if (activeWallet instanceof NDKNWCWallet) {
                    zapper.on('ln_invoice', ({ recipientPubkey, type, pr }) => {
                        addNWCZap({ target, recipientPubkey, pr, zapType: type, pendingPaymentId: pendingPayment.internalId });
                    })
                }

                await zapper.zap();
            } catch (error: any) {
                console.error('Error while zapping:', error);
                toast.error(error.message);
            }
        },
        [activeWallet?.walletId, addPendingPayment]
    );

    return sendZap;
}