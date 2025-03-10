import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { formatMoney } from '~/utils/bitcoin';
import { useColorScheme } from '@/lib/useColorScheme';

export default function WalletBalance({
  amount,
  onPress,
  onLongPress,
  unit,
}: {
  amount: number;
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
                    <Text style={[styles.balanceText, { color: colors.foreground }]} numberOfLines={1}>
                        {numberWithThousandsSeparator(amount)}
                    </Text>
                    <Text style={[styles.satText, { color: colors.foreground }]}>
                        {formatMoney({ amount, unit: 'sat', hideAmount: true })}
                    </Text>
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
