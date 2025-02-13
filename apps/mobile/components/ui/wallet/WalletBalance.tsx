import { Platform, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { formatMoney } from '~/utils/bitcoin';
import Ticker from '../ticker';

export default function WalletBalance({ amount, onPress, onLongPress }: { amount: number; unit: string; onPress?: () => void; onLongPress?: () => void }) {
    const numberWithThousandsSeparator = (amount: number) => {
        return amount.toLocaleString();
    };

    return (
        <TouchableOpacity className="flex-col p-4 mb-10" onPress={onPress} onLongPress={onLongPress}>
            <View className="flex-col justify-center rounded-lg py-10 text-center">
                <View className="flex-col items-center gap-1 flex-1">
                    {Platform.OS === 'ios' ? (
                        <Ticker value={amount} fontSize={5000} />
                    ) : (
                        <>
                            <Text className="whitespace-nowrap text-6xl font-black text-foreground">
                                {numberWithThousandsSeparator(amount)}
                            </Text>
                            <Text className="pb-1 text-lg font-medium text-foreground opacity-50">
                                {formatMoney({ amount, unit: 'sat', hideAmount: true })}
                            </Text>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}
