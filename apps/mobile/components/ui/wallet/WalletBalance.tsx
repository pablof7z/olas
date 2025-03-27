import { TouchableOpacity, View, StyleSheet, Text, ActivityIndicator } from 'react-native';

import { useColorScheme } from '@/lib/useColorScheme';
import { formatMoney } from '~/utils/bitcoin';

export default function WalletBalance({
    amount,
    onPress,
    onLongPress,
    unit,
}: {
    amount?: number;
    unit: string;
    onPress?: () => void;
    onLongPress?: () => void;
}) {
    const { colors } = useColorScheme();
    const numberWithThousandsSeparator = (amount: number) => {
        return amount.toLocaleString();
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} onLongPress={onLongPress}>
            <View style={styles.balanceContainer}>
                {typeof amount === 'number' ? (
                    <>
                        <Text style={[styles.balanceText, { color: colors.foreground }]} numberOfLines={1} testID="balance-text">
                            {numberWithThousandsSeparator(amount)}
                        </Text>
                        <Text style={[styles.satText, { color: colors.foreground }]}>
                            {formatMoney({ amount, unit: 'sat', hideAmount: true })}
                        </Text>
                    </>
                ) : (
                    <ActivityIndicator />
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    balanceText: {
        fontWeight: 900,
        fontSize: 90,
    },
    satText: {
        paddingBottom: 4,
    },
});
