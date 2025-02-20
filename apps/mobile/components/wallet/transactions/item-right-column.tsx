import { useColorScheme } from "@/lib/useColorScheme";
import { formatMoney } from "@/utils/bitcoin";
import { Timer } from "lucide-react-native";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { useMintInfo } from "@/hooks/mint";
import { Image } from "expo-image";
export function ItemRightColumn({ mint, amount, unit = 'sats', isPending }: { mint?: string, amount: number, unit: string, isPending: boolean }) {
    const {mintInfo} = useMintInfo(mint);
    
    const { colors } = useColorScheme();
    const niceAmount = formatMoney({ amount, unit, hideUnit: true });
    const niceUnit = formatMoney({ amount, unit, hideAmount: true });

    if (!amount) return null;

    return (
        <View style={rightViewStyles.container}>
            {isPending && <Timer size={24} color={colors.muted} />}
            <View style={rightViewStyles.column}>
                <Text className="text-xl font-bold text-foreground">{niceAmount}</Text>
                <Text className="text-sm text-muted-foreground">{niceUnit}</Text>
                {mintInfo && <View className="flex-row items-center gap-1">
                    <Image source={{ uri: mintInfo.icon_url }} style={{ width: 16, height: 16, borderRadius: 4 }} />
                </View>}
            </View>
        </View>
    )
}

const rightViewStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        marginRight: 10,
    },
    column: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: -10,
    }
}) 