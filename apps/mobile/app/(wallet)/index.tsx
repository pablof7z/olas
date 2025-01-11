import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from "react-native";
import { NDKCashuMintList, NDKEvent, NDKKind, NDKNutzap, NDKPaymentConfirmation, NDKUser, NDKZapper, NDKZapSplit, useNDK, useNDKCurrentUser, useNDKSession, useNDKSessionEventKind, useNDKSessionEvents, useNDKWallet, useSubscribe, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuWallet, NDKNWCWallet, NDKWallet, NDKWalletBalance, NDKWalletChange } from "@nostr-dev-kit/ndk-wallet";
import { useEffect, useMemo, useRef, useState } from "react";
import { router, Stack, Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Button } from "@/components/nativewindui/Button";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bolt, BookDown, ChevronDown, Cog, Eye, Settings, Settings2, User2, ZoomIn } from "lucide-react-native";
import * as User from '@/components/ui/user';
import { useColorScheme } from "@/lib/useColorScheme";
import TransactionHistory from "@/components/wallet/transactions/list";
import WalletBalance from "@/components/ui/wallet/WalletBalance";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    return (
        <View className="flex-1 flex-col h-full min-h-[100px]">
            <TransactionHistory wallet={wallet} />
        </View>
    );
}

export default function WalletScreen() {
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const { activeWallet, balance } = useNDKWallet();
    const mintList = useNDKSessionEventKind<NDKCashuMintList>(NDKCashuMintList, NDKKind.CashuMintList, { create: true });

    const isNutzapWallet = useMemo(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return false;
        if (!mintList) return false;
        return mintList.p2pk === activeWallet.p2pk;
    }, [activeWallet, mintList]);

    const setNutzapWallet = async () => {
        try {
            if (!mintList || !(activeWallet instanceof NDKCashuWallet)) return;
            mintList.ndk = ndk;
            console.log('setNutzapWallet', activeWallet.event.rawEvent(), mintList.rawEvent());
            mintList.p2pk = activeWallet.p2pk;
            mintList.mints = activeWallet.mints;
            mintList.relays = activeWallet.relays;
            await mintList.sign();
            mintList.publishReplaceable();
            console.log('mintList', JSON.stringify(mintList.rawEvent(), null, 2));
        } catch (e) {
            console.error('error', e);
        }
    }

    const inset = useSafeAreaInsets();

    return (
        <>
            <Tabs.Screen
                options={{
                    headerShown: false,
                    headerTransparent: true,
                    headerBackground: () => <BlurView intensity={100} tint="light" />,  
                }}
            />
            <SafeAreaView className="flex-1" style={{ paddingTop: inset.top }}>
                <View className="flex-1 flex-col">
                    <View className="flex-col grow">
                        {/* {!isNutzapWallet && (
                            <Button onPress={setNutzapWallet}>
                                <Text>Enable Nutzaps</Text>
                            </Button>
                        )} */}
                        
                        {balance && <WalletBalance amount={balance.amount} unit={balance.unit} onPress={() => activeWallet?.updateBalance?.()} />}
                        <Footer activeWallet={activeWallet} currentUser={currentUser} />
                        {activeWallet instanceof NDKNWCWallet && <WalletNWC wallet={activeWallet} />}
                        {activeWallet instanceof NDKCashuWallet && <WalletNip60 wallet={activeWallet} />}
                    </View>
                </View>
            </SafeAreaView>
            </>
    );
}

function HeaderLeft() {
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();

    const { userProfile } = useUserProfile(currentUser?.pubkey);

    return (
        <TouchableOpacity className="ml-2" onPress={() => router.push('/(tabs)/(settings)')}>
            {currentUser && userProfile?.image ? (
                <User.Avatar userProfile={userProfile} size={24} className="w-10 h-10" />
            ) : (
                <Settings size={24} color={colors.muted} className="w-10 h-10" />
            )}
        </TouchableOpacity>
    )
}

function Footer({ activeWallet, currentUser }: { activeWallet: NDKWallet, currentUser: NDKUser }) {
    if (activeWallet) {
        return <WalletButtons />
    } else if (currentUser) {
        return <Text>Bug: You don't have a wallet; how did you get here?</Text>
    } else {
        return <Text>Not logged in!</Text>
    }
}

function WalletButtons() {
    const receive = () => router.push('/receive')
    const send = () => router.push('/send')
    
    return (
        <View className="flex-row justify-evenly p-4 gap-6">
            <Button variant="secondary" className="grow items-center bg-foreground" onPress={receive}>
                <Text className="py-2 text-background font-bold text-lg uppercase">Receive</Text>
            </Button>
            <Button variant="secondary" className="grow items-center bg-foreground" onPress={send}>
                <Text className="py-2 text-background font-bold text-lg uppercase">Send</Text>
            </Button>
        </View>
    )
}