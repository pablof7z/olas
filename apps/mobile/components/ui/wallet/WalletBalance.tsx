import { NDKWallet, NDKWalletBalance } from "@nostr-dev-kit/ndk-wallet";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { formatMoney } from "~/utils/bitcoin";

export default function WalletBalance({ amount, unit, onPress }: { amount: number, unit: string, onPress: () => void }) {
    const numberWithThousandsSeparator = (amount: number) => {
        return amount.toLocaleString();
    }

    return <TouchableOpacity className="p-4 flex-col" onPress={onPress}>
        <View className="flex-col justify-center py-10 rounded-lg text-center">
            <View className="flex-col items-center gap-1">
                <Text className="text-6xl whitespace-nowrap text-foreground font-black">
                    {numberWithThousandsSeparator(amount)}  
                </Text>
                <Text className="text-lg text-foreground font-medium opacity-50 pb-1">
                    {formatMoney({ amount, unit: unit, hideAmount: true })}
                </Text>
            </View>
        </View>
    </TouchableOpacity>;
}