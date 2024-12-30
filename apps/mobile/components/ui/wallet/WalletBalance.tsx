import { NDKWallet, NDKWalletBalance } from '@nostr-dev-kit/ndk-wallet';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { formatMoney } from '~/utils/bitcoin';

export default function WalletBalance({ amount, unit, onPress }: { amount: number; unit: string; onPress: () => void }) {
    const numberWithThousandsSeparator = (amount: number) => {
        return amount.toLocaleString();
    };

    return (
        <TouchableOpacity className="flex-col p-4" onPress={onPress}>
            <View className="flex-col justify-center rounded-lg py-10 text-center">
                <View className="flex-col items-center gap-1">
                    <Text className="whitespace-nowrap text-6xl font-black text-foreground">{numberWithThousandsSeparator(amount)}</Text>
                    <Text className="pb-1 text-lg font-medium text-foreground opacity-50">
                        {formatMoney({ amount, unit: unit, hideAmount: true })}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}
