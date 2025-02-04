import { useNDK, useNDKWallet, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { NDKNWCTransaction, NDKNWCWallet } from "@nostr-dev-kit/ndk-wallet";
import { RefreshControl, View } from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { FlashList } from "@shopify/flash-list";
import { Text } from "@/components/nativewindui/Text";
import { ListItem } from "@/components/nativewindui/List";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/utils/bitcoin";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import * as User from "@/components/ui/user";
import RelativeTime from "@/app/components/relative-time";

export default function NWCListTansactions() {
    const { activeWallet } = useNDKWallet();
    const [txs, setTxs] = useState<NDKNWCTransaction[]>([]);
    const fetchRef = useRef<NodeJS.Timeout | null>(null);

    const fetchTransactions = useCallback(() => {
        if (!(activeWallet instanceof NDKNWCWallet)) return;
        console.log('fetching transactions', activeWallet.walletId);
        if (fetchRef.current) clearTimeout(fetchRef.current);
        fetchRef.current = setTimeout(() => {
            console.log('fetching transactions', activeWallet.walletId);
            activeWallet.listTransactions().then(({transactions}) => {
                console.log('transactions', transactions);
                setTxs(transactions);
            });
        }, 500);
    }, [activeWallet?.walletId])

    useEffect(() => {
        fetchTransactions();
        activeWallet.on('balance_updated', fetchTransactions);

        return () => {
            activeWallet.off('balance_updated', fetchTransactions);
        }
    }, [fetchTransactions])

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        console.log('refreshing', activeWallet?.walletId);
        const timeout = setTimeout(() => setRefreshing(false), 6000);
        activeWallet?.updateBalance()
            .then(() => {
                console.log('balance updated');
            })
            .catch((err) => {
                console.error('error updating balance', err);
            })
            .finally(() => {
                fetchTransactions();
                setRefreshing(false);
                clearTimeout(timeout);
            })
    }, [activeWallet?.walletId])
    
    
    return <FlashList
        data={txs}
        renderItem={({ item, index, target }) => <Item item={item} index={index} target={target} onPress={() => {}} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    />
}

function Item({ item, index, target, onPress }: { item: NDKNWCTransaction, index: number, target: any, onPress: () => void }) {
    return (
        <ListItem
            className={cn('px-2 !bg-transparent', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
            target={target}
            item={{
                id: item.amount,
                title: item.description,
            }}
            leftView={<LeftView direction={item.type} />}
            rightView={<RightView amount={item.amount} unit={"msats"} createdAt={item.created_at} />}
            index={index}
            onPress={onPress}
        >
            <RelativeTime className="text-xs text-muted-foreground" timestamp={item.created_at} />
        </ListItem>  
    )
}

const LeftView = ({ direction, pubkey }: { direction: 'incoming' | 'outgoing', pubkey?: string }) => {
    const { userProfile } = useUserProfile(pubkey);
    const { colors } = useColorScheme();

    const color = colors.primary;

    if (pubkey && userProfile) {
        return (
            <View className="flex-row items-center gap-2 relative" style={{ marginRight: 10}}>
                {userProfile && <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={48} />}
                {direction === 'outgoing' && (
                    <View className="absolute -right-2 -top-2 rotate-45">
                        <ArrowUp size={18} color={color} />
                    </View>
                )}
                {direction === 'incoming' && (
                    <View className="absolute -right-2 -bottom-2 -rotate-45">
                        <ArrowDown size={18} color={color} />
                    </View>
                )}
            </View>
        )
    }
    
    return (
        <View className="flex-row items-center gap-2 mr-2">
            {direction === 'outgoing' ? <ArrowUp size={24} color={color} /> : <ArrowDown size={24} color={color} />}
        </View>
    )
}


function RightView({ amount, unit, createdAt }: { amount: number, unit: string, createdAt: number }) {
    if (!amount) return null;

    const niceAmount = formatMoney({ amount, unit, hideUnit: true });
    const niceUnit = formatMoney({ amount, unit, hideAmount: true });

    return (
        <View className="flex-col items-end -gap-1">
            <Text className="text-lg font-bold text-foreground font-mono">{niceAmount}</Text>
            <Text className="text-sm text-muted-foreground">{niceUnit}</Text>
        </View>
    )
}