import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNDKSession, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import * as SecureStore from 'expo-secure-store';
import { NDKCashuWallet, NDKNWCWallet, NDKWallet, NDKWalletBalance } from '@nostr-dev-kit/ndk-wallet';
import { useMemo, useState } from 'react';
import { router, Stack } from 'expo-router';
import { formatMoney, nicelyFormattedMilliSatNumber, nicelyFormattedSatNumber } from '@/utils/bitcoin';
import { List, ListItem } from '@/components/nativewindui/List';
import { cn } from '@/lib/cn';
import { BlurView } from 'expo-blur';
import { Button } from '@/components/nativewindui/Button';

function WalletBalance({ wallet, balances }: { wallet: NDKWallet; balances: NDKWalletBalance[] }) {
    function update() {
        wallet?.updateBalance?.();
    }

    const numberWithThousandsSeparator = (amount: number) => {
        return amount.toLocaleString();
    };

    return (
        <TouchableOpacity className="flex-col p-4" onPress={update}>
            {balances?.map((balance, i) => (
                <View key={i} className="flex-col justify-center rounded-lg py-10 text-center">
                    <View className="flex-col items-center gap-1">
                        <Text className="whitespace-nowrap text-6xl font-black text-foreground">
                            {numberWithThousandsSeparator(balance.amount)}
                        </Text>
                        <Text className="pb-1 text-lg font-medium text-foreground opacity-50">
                            {formatMoney({ amount: balance.amount, unit: balance.unit, hideAmount: true })}
                        </Text>
                    </View>
                </View>
            ))}
        </TouchableOpacity>
    );
}

function WalletNWC({ wallet }: { wallet: NDKNWCWallet }) {
    const [info, setInfo] = useState<Record<string, any> | null>(null);
    wallet.getInfo().then((info) => {
        console.log('info', info);
        setInfo(info);
    });

    return (
        <View>
            <Text>{JSON.stringify(info)}</Text>
        </View>
    );
}

function WalletNip60({ wallet }: { wallet: NDKCashuWallet }) {
    const mintBalances = wallet.mintBalances;

    wallet.start();

    return (
        <View className="h-full min-h-[100px] flex-1 flex-col">
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
                        rightView={
                            <Text className="text-muted-foreground">{formatMoney({ amount: mintBalances[item], unit: wallet.unit })}</Text>
                        }
                        index={index}
                        onPress={() => console.log('onPress')}
                    />
                )}
            />
        </View>
    );
}

export default function WalletScreen() {
    const { activeWallet, balances, setActiveWallet } = useNDKWallet();

    function unlink() {
        SecureStore.deleteItemAsync('nwc');
        setActiveWallet(null);
        router.back();
    }

    function receive() {
        router.push('/(wallet)/receive');
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
                <View className="grow flex-col">
                    <WalletBalance wallet={activeWallet} balances={balances} />

                    {activeWallet instanceof NDKNWCWallet && <WalletNWC wallet={activeWallet} />}
                    {activeWallet instanceof NDKCashuWallet && <WalletNip60 wallet={activeWallet} />}
                </View>

                <View className="flex-row justify-stretch gap-14 p-4">
                    <Button variant="primary" className="grow items-center" onPress={receive}>
                        <Text className="py-2 font-bold text-xl text-white">Receive</Text>
                    </Button>
                    <Button variant="primary" className="grow items-center">
                        <Text className="py-2 font-bold text-xl text-white">Send</Text>
                    </Button>
                </View>
            </View>
        </SafeAreaView>
    );
}
