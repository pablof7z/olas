import { View, Text, SafeAreaView, TouchableOpacity } from "react-native";
import { useNDKSession } from "@nostr-dev-kit/ndk-mobile";
import * as SecureStore from 'expo-secure-store';
import { NDKCashuWallet, NDKNWCWallet, NDKWallet, NDKWalletBalance } from "@nostr-dev-kit/ndk-wallet";
import { useMemo, useState } from "react";
import { router, Stack } from "expo-router";
import { formatMoney, nicelyFormattedMilliSatNumber, nicelyFormattedSatNumber } from "@/utils/bitcoin";
import { List, ListItem } from "@/components/nativewindui/List";
import { cn } from "@/lib/cn";
import { BlurView } from "expo-blur";
import { TabBarIcon } from "@/components/TabBarIcon";
import { Button } from "@/components/nativewindui/Button";

function WalletNWC({ wallet }: { wallet: NDKNWCWallet }) {
    const [info, setInfo] = useState<Record<string, any> | null>(null);
    wallet.getInfo().then((info) => {
        console.log('info', info);
        setInfo(info)
    });

    return <View>
        <Text>{JSON.stringify(info)}</Text>
    </View>;
}

function WalletNip60({ wallet }: { wallet: NDKCashuWallet }) {
    const mintBalances = wallet.mintBalances;

    console.log('mintBalances', mintBalances);
    console.log('wallet tokens', wallet.tokens.length);
    
    return <View className="flex-1 flex-col h-full min-h-[100px]">
        <List
        data={Object.keys(mintBalances)}
        keyExtractor={(item) => item}
        estimatedItemSize={56}
            contentInsetAdjustmentBehavior="automatic"
            sectionHeaderAsGap
            variant="insets"
            renderItem={({ item, index, target }) => (
                <ListItem
                className={cn('ios:pl-0 pl-2', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
                target={target}
                item={{
                    id: item,
                    title: item,
                }}
                rightView={<Text className="text-muted-foreground">{formatMoney({ amount: mintBalances[item], unit: wallet.unit })}</Text>}
                index={index}
                onPress={() => console.log('onPress')}
            />  
        )}
        />
    </View>;
}

function BalanceCard({ wallet, balances }: { wallet: NDKWallet, balances: NDKWalletBalance[] }) {
    function update() {
        console.log('updating balance');
        wallet?.updateBalance?.().then(() => {
            console.log('updated', wallet.balance());
        });
    }

    const numberWithThousandsSeparator = (amount: number) => {
        return amount.toLocaleString();
    }

    return <TouchableOpacity className="p-4 flex-col" onPress={update}>
        {balances.map((balance, i) => (
            <View key={i} className="flex-col justify-center py-10 rounded-lg text-center">
                <View className="flex-col items-center gap-1">
                <Text className="text-6xl whitespace-nowrap text-foreground font-black">
                    {numberWithThousandsSeparator(balance.amount)}  
                </Text>
                <Text className="text-lg text-foreground font-medium opacity-50 pb-1">
                    {formatMoney({ amount: balance.amount, unit: balance.unit, hideAmount: true })}
                </Text>
                </View>
            </View>
        ))}
    </TouchableOpacity>;
}

export default function WalletScreen() {
    const { activeWallet, balances, setActiveWallet } = useNDKSession();

    

    function unlink() {
        SecureStore.deleteItemAsync('nwc');
        setActiveWallet(null);
        router.back();
    }

    function deposit() {
        router.push('deposit')
    }

    return (
        <SafeAreaView className="flex-1 bg-card">
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerBackground: () => <BlurView intensity={100} tint="light" />,  
                    headerTitle: activeWallet?.name || activeWallet?.type,
                    headerRight: () => (
                        <TouchableOpacity onPress={unlink}>
                            <Text className="text-red-500">Unlink</Text>
                        </TouchableOpacity>
                    ),
                }}
            />

            <View className="flex-1 flex-col">
                <View className="flex-col grow">
                    <BalanceCard wallet={activeWallet} balances={balances} />
                    
                    {activeWallet instanceof NDKNWCWallet && <WalletNWC wallet={activeWallet} />}
                    {activeWallet instanceof NDKCashuWallet && <WalletNip60 wallet={activeWallet} />}
                </View>

                <View className="flex-row justify-stretch p-4 gap-14">
                    <Button variant="primary" className="grow items-center" onPress={deposit}>
                        <Text className="py-2 text-white font-medium">Receive</Text>
                    </Button>
                    <Button variant="primary" className="grow items-center">
                        <Text className="py-2 text-whitefont-medium">Send</Text>
                    </Button>
                </View>
            </View>
        </SafeAreaView>
    );
}
