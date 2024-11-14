import { View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { NDKCashuWallet, NDKWalletChange } from "@nostr-dev-kit/ndk-wallet";
import { useEffect, useMemo, useState } from "react";
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { useSubscribe } from "@/ndk-expo/hooks/subscribe";
import { LineChart } from "react-native-gifted-charts";
import { useDebounce } from "@uidotdev/usehooks";
import { FlashList } from "@shopify/flash-list";

interface HistoryProps {
    wallet: NDKCashuWallet;
}

function HistoryItem({ event, wallet }: { event: NDKWalletChange, wallet: NDKCashuWallet }) {
    // console.log('event', event?.id);
    // const [history, setHistory] = useState<NDKWalletChange | null>(null);

    // useEffect(() => {
    //     NDKWalletChange.from(event).then((e) => {
    //         setHistory(e);
    //     });
    // }, [event]);
    
    if (!event) return null;

    if (event.direction === 'out') {
        return <Text>{event?.direction}</Text>
    } else {
        return (
            <>
                <Text style={{ color: 'green' }}>{event.amount} {wallet.unit}</Text>
                <Text>{event.description}</Text>
            </>
            
        );
    }
}

export default function History({ wallet }: HistoryProps) {
    const filters = useMemo(() => [
        { kinds: [NDKKind.WalletChange], ...wallet.event.filter() }
    ], [wallet.event]);
    const opts = useMemo(() => ({
        klass: NDKWalletChange,
    }), []);
    const { events: history } = useSubscribe<NDKWalletChange>({ filters, opts });

    const [chartData, setChartData] = useState<{ value: number }[]>([]);

    useEffect(() => {
        let balance = 0;
        let addedEvent = new Set<string>();
        const data = history.map((change: NDKWalletChange) => {
            if (addedEvent.has(change.id)) return null;
            addedEvent.add(change.id);
            if (!change.amount) return null;
            if (change.direction === 'in') {
                balance += parseInt(change.amount as unknown as string);
            } else {
                balance -= parseInt(change.amount as unknown as string);
            }
            return {
                value: balance,
            };
        }).filter((item) => item !== null);
        setChartData(data);
    }, [history]);

    const debouncedChartData = useDebounce(chartData, 100);

    return (
        <View>
            <View style={{ flex: 1, alignItems: 'center', width: '100%' }} className="rounded-lg">
                <LineChart
                    hideRules={true}
                    data={debouncedChartData}
                    width={300}
                    height={100}
                    adjustToWidth
                    yAxisLabelWidth={50}
                    thickness={2}
                    hideDataPoints
                    curved
                    noOfSections={4}
                />
            </View>
            <FlashList
                data={history}
                estimatedItemSize={88}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <HistoryItem key={item.id} wallet={wallet} event={item} />
                )}
            />
        </View>
    );
}