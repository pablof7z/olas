import { View, Dimensions } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useMemo } from "react";
import { PieChart } from "react-native-gifted-charts";
import { FlashList } from "@shopify/flash-list";

interface MintsProps {
    wallet: NDKCashuWallet;
}

export default function Mints({ wallet }: MintsProps) {
    const mintBalances = useMemo(() => wallet.mintBalances, [wallet.mintBalances]);

    const chartData = useMemo(() => {
        return Object.entries(mintBalances).map(([mint, balance], index) => {
            const url = new URL(mint);
            const hostname = url.hostname;
            const shade = Math.floor((255 / Object.keys(mintBalances).length) * index);
            const color = `rgb(${255 - shade}, ${shade / 2}, ${155 + shade / 3})`;
            return {
                name: hostname,
                balance,
                color,
            };
        });
    }, [mintBalances]);

    return (
        <View style={{ flex: 1, alignItems: 'center', width: '100%' }}>
            <View style={{ alignItems: 'center', paddingHorizontal: 10, marginVertical: 20 }}>
                <PieChart
                    data={chartData.map(item => ({
                        value: item.balance,
                        color: item.color,
                    }))}
                    donut
                    radius={150}
                    innerRadius={100}
                    centerLabelComponent={() => (
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                            {Object.keys(mintBalances).length} Mints
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
                            <Text style={{ flex: 1 }}>{item.name}</Text>
                            <Text style={{ flex: 0 }}>
                                {`${item.balance} ${wallet.unit}`}
                            </Text>
                        </View>
                    )}
                    estimatedItemSize={50}
                    keyExtractor={(item) => item.name}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </View>
    );
}
