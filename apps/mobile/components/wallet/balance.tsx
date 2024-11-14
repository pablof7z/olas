import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { NDKWalletBalance } from "@nostr-dev-kit/ndk-wallet";
import WalletBalance from "../ui/wallet/WalletBalance";
interface BalanceProps {
    wallet: NDKCashuWallet
};

export default function Balance({ wallet }: BalanceProps) {
    const [balances, setBalances] = useState<NDKWalletBalance[] | undefined>(undefined);

    const fetchBalance = useCallback(async () => {
        try {
            const walletBalances = await wallet.balance();
            setBalances(walletBalances);
        } catch (error) {
            console.error('Error fetching wallet balance:', error);
            setBalances(undefined);
        }
    }, [wallet]);

    useEffect(() => {
        fetchBalance();

        // Listen for balance_updated event
        wallet.on('balance_updated', fetchBalance);

        // Cleanup function
        return () => {
            console.log('unmounting');
            wallet.off('balance_updated', fetchBalance);
        };
    }, [wallet]);
    
    return (
        <View style={{ flexDirection: 'row', gap: 10 }}>
            {balances?.map((balance, index) => (
                <View key={index} style={{ width: '100%' }}>
                    <WalletBalance balance={balance.amount} unit={balance.unit} />
                </View>
            ))}
        </View>
    )
}