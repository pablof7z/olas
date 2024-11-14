import { View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useMemo } from "react";
import { PieChart } from "react-native-gifted-charts";
import { FlashList } from "@shopify/flash-list";

interface TokensProps {
    wallet: NDKCashuWallet;
}

export default function Tokens({ wallet }: TokensProps) {
    const unit = wallet.unit;
    const tokens = wallet.tokens;
    const tokensByValue = useMemo(() => {
        const values: Record<number, number> = {};

        tokens.forEach((token) => {
            console.log('token with amount', token.amount, 'there are currently ', values[token.amount] ?? 0, 'of them');
            values[token.amount] = (values[token.amount] ?? 0) + 1;
        });

        return values;
    }, [tokens]);

    const chartData = useMemo(() => {
        return Object.entries(tokensByValue).map(([amount, count], index) => {
            const shade = Math.floor((255 / Object.keys(tokensByValue).length) * index);
            const color = `rgb(${255 - shade}, ${shade / 2}, ${155 + shade / 3})`;
                                                                        
            return {
                amount,
                count,
                color,
            };
        });
    }, [tokensByValue]);

    return (
        <View style={{ flex: 1, alignItems: 'center', width: '100%' }}>
            <View style={{ alignItems: 'center', paddingHorizontal: 10, marginVertical: 20 }}>
                <PieChart
                    data={chartData.map(item => ({
                        value: item.count,
                        color: item.color,
                    }))}
                    donut
                    radius={150}
                    innerRadius={100}
                    centerLabelComponent={() => (
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                            {tokens.length} Tokens
                        </Text>
                    )}
                />
            </View>

            <View style={{ flex: 1, width: '100%' }}>
                <FlashList
                    data={chartData}
                    renderItem={({ item }) => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5, paddingHorizontal: 10, width: '100%' }}>
                            <View style={{ width: 20, height: 20, backgroundColor: item.color, marginRight: 10 }} />
                            <Text style={{ flex: 1 }}>{`${item.amount} ${unit}`}</Text>
                            <Text style={{ flex: 1, marginRight: 10 }}>
                                {`${item.count} proofs`}
                            </Text>
                            <Text style={{ flex: 0 }}>
                                {`${Number(item.amount) * item.count} ${unit}`}
                            </Text>
                        </View>
                    )}
                    estimatedItemSize={50}
                    keyExtractor={(item) => item.amount}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </View>
    );
}