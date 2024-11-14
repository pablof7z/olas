import { Dimensions, StyleSheet, Touchable, TouchableNativeFeedback, View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { prettifySatoshis } from "@/lib/utils";

interface WalletBalanceProps {
    balance: number;
    unit: string;
    onPress?: () => void;
}

export default function WalletBalance({
    balance,
    unit,
    onPress
}: WalletBalanceProps) {
    return (
        <TouchableNativeFeedback onPress={onPress}>
            <View style={styles.balanceContainer}>
                <Text style={styles.balance}>{prettifySatoshis(balance)}</Text>
                <Text style={styles.unit}>{unit}</Text>
            </View>
        </TouchableNativeFeedback>
    )
}

export const styles = StyleSheet.create({
    balanceContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Ensure container spans the width to avoid cutting off the text
    },
    balance: {
        fontSize: 100, // Slightly reduce the font size to prevent overflow
        fontWeight: '800',
        lineHeight: 140,
        color: '#000000',
        textAlign: 'center',
        flexWrap: 'nowrap', // Prevent wrapping in case the number is too large
    },
    unit: {
        fontSize: 24,
        fontWeight: '300',
        color: '#000000',
        marginTop: -12,
        textAlign: 'center',
    },
})
