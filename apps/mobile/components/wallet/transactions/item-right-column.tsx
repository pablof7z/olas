import { Image } from 'expo-image';
import { Timer } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/nativewindui/Text';
import { useMintInfo } from '@/hooks/mint';
import { useColorScheme } from '@/lib/useColorScheme';
import { formatMoney } from '@/utils/bitcoin';

export function ItemRightColumn({
    mint,
    amount,
    unit = 'sats',
    isPending,
}: {
    mint?: string;
    amount: number;
    unit: string;
    isPending: boolean;
}) {
    const { mintInfo } = useMintInfo(mint);

    const { colors } = useColorScheme();
    const niceAmount = formatMoney({ amount, unit, hideUnit: true });
    const niceUnit = formatMoney({ amount, unit, hideAmount: true });

    if (!amount) return null;

    return (
        <View style={styles.container}>
            {isPending && <Timer size={24} color={colors.muted} />}
            <View style={styles.column}>
                <Text className="text-2xl font-bold text-foreground">{niceAmount}</Text>
                <View style={styles.unitContainer}>
                    {mintInfo && (
                        <View className="flex-row items-center gap-1">
                            <Image
                                source={{ uri: mintInfo.icon_url }}
                                style={{ width: 16, height: 16, borderRadius: 4 }}
                            />
                        </View>
                    )}
                    <Text className="text-xs text-muted-foreground">{niceUnit}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    },
    unitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
});
