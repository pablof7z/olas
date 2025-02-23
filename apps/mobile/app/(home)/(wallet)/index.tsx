import { View, Text, SafeAreaView, TouchableOpacity, Pressable } from "react-native";
import { NDKCashuMintList, NDKKind, NDKUser, useNDK, useNDKCurrentUser, useNDKSessionEventKind, useNDKSessionEvents, useNDKWallet, useSubscribe, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuWallet, NDKNWCGetInfoResult, NDKNWCWallet, NDKWallet } from "@nostr-dev-kit/ndk-wallet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { router, Stack, Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Button } from "@/components/nativewindui/Button";
import { QrCode, Settings, SettingsIcon } from "lucide-react-native";
import * as User from '@/components/ui/user';
import { useColorScheme } from "@/lib/useColorScheme";
import TransactionHistory from "@/components/wallet/transactions/list";
import WalletBalance from "@/components/ui/wallet/WalletBalance";
import NWCListTansactions from "@/components/wallet/nwc/list-transactions";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

const nwcInfoAtom = atom<NDKNWCGetInfoResult | null, [NDKNWCGetInfoResult | null], null>(null, (get, set, value) => set(nwcInfoAtom, value));
const walletTitleAtom = atom<string | null, [string | null], void>(null, (get, set, value) => set(walletTitleAtom, value));

function WalletNWC({ wallet }: { wallet: NDKNWCWallet }) {
    const [info, setInfo] = useAtom(nwcInfoAtom);
    const setWalletTitle = useSetAtom(walletTitleAtom);
    const [showTimeoutError, setShowTimeoutError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const timeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        console.log('updating balance', wallet.walletId);
        wallet.updateBalance();
    }, [wallet?.walletId])
    
    useEffect(() => {
        console.log('updating info', wallet.walletId);
        timeout.current = setTimeout(() => {
            setShowTimeoutError(true);
        }, 10000);
        
        wallet.getInfo().then((info) => {
            console.log('NWC info', info);
            setInfo(info)
            setWalletTitle(info.alias);
            if (timeout.current) {
                clearTimeout(timeout.current);
                timeout.current = null;
            }
        }).catch((e) => {
            console.log('NWC info error', e);
        });

        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current);
                timeout.current = null;
            }
        }
    }, [wallet?.walletId, retryCount])

    // if (!info) {
    //     return <ActivityIndicator />
    // }

    if (showTimeoutError) {
        return <View className="flex-1 bg-red-500 text-white p-3 absolute top-0 left-0 right-0">
            <Text className="text-white">Timeout error</Text>
            <Pressable onPress={() => {
                setShowTimeoutError(false);
                setRetryCount(retryCount + 1);
                wallet.getInfo();
            }}>
                <Text className="text-white font-bold">Retry</Text>
            </Pressable>
        </View>
    }

    return <View className="flex-1">
        <NWCListTansactions />
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
    const currentUser = useNDKCurrentUser();
    const { activeWallet, balance } = useNDKWallet();
    const mintList = useNDKSessionEventKind<NDKCashuMintList>(NDKKind.CashuMintList, { create: NDKCashuMintList });
    const [isTestnutWallet, setIsTestnutWallet] = useState(false);

    useEffect(() => {
        if (!activeWallet) return;

        if (activeWallet instanceof NDKCashuWallet && activeWallet.mints?.some(m => m.match(/testnut\.cashu/))) {
            setIsTestnutWallet(true);
        }
    }, [ mintList?.id ])

    const onLongPress = useCallback(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;
        const dump = activeWallet.state.dump();
        console.log("balances", JSON.stringify(dump.balances, null, 2)); 
        console.log("proofs", JSON.stringify(dump.proofs, null, 2));
        console.log("tokens", JSON.stringify(dump.tokens.map(te => ({
            tokenId: te.token?.id,
            proofCount: te.token?.proofs.length,
            proofAmount: te.token?.proofs.reduce((acc, p) => acc + p.amount, 0),
            proofs: te.token?.proofs.map(p => p.C),
            mint: te.token?.mint,
            status: te.state,
            date: new Date(te.token?.created_at*1000).toLocaleString(),
        })), null, 2));
        console.log("Journal");
        console.log(JSON.stringify(activeWallet.state.journal, null, 2));
    }, [activeWallet?.walletId]);

    const { colors } = useColorScheme();
    const walletTitle = useAtomValue(walletTitleAtom);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    title: walletTitle,
                    headerBackground: () => <BlurView intensity={100} tint="light" />,  
                    headerRight: () => <TouchableOpacity onPress={() => router.push('/(home)/(wallet)/(walletSettings)')}>
                        <SettingsIcon size={24} color={colors.foreground} />
                    </TouchableOpacity>
                }}
            />
            <SafeAreaView className="flex-1">
                <View className="flex-1 flex-col">
                    <View className="flex-col grow">
                        {isTestnutWallet && (
                            <Pressable className="flex-row items-center justify-center bg-red-500/30 ios:rounded-t-md p-4" onPress={() => {
                                router.push('/(home)/(wallet)/(walletSettings)/mints');
                            }}>
                                <Text className="text-red-800">
                                    You are using a test mint. Click here to remove it.
                                </Text>
                            </Pressable>
                        )}
                        {/* {!isNutzapWallet && (
                            <Button onPress={setNutzapWallet}>
                                <Text>Enable Nutzaps</Text>
                            </Button>
                        )} */}
                        
                        {balance && <WalletBalance amount={balance.amount} onPress={() => activeWallet?.updateBalance?.()} onLongPress={onLongPress}/>}

                        {/* {activeWallet instanceof NDKNWCWallet && <WalletNWC wallet={activeWallet} />} */}
                        {activeWallet instanceof NDKCashuWallet && (<>
                            <Footer activeWallet={activeWallet} currentUser={currentUser} />
                            <WalletNip60 wallet={activeWallet} />
                        </>)}

                        {activeWallet instanceof NDKNWCWallet && <WalletNWC wallet={activeWallet} />}
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
        <TouchableOpacity className="ml-2" onPress={() => router.push('/(home)/(settings)')}>
            {currentUser && userProfile?.image ? (
                <User.Avatar pubkey={currentUser.pubkey} userProfile={userProfile} imageSize={24} />
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
    const scan = () => router.push('/scan')
    const { colors } = useColorScheme();
    
    return (
        <View className="flex-row justify-evenly p-4">
            <Button variant="secondary" className="grow items-center bg-foreground -mr-[25px] h-[65px]" onPress={receive}>
                <Text className="py-2 text-background font-bold text-lg uppercase">Receive</Text>
            </Button>
            <Button variant="secondary" className="flex-none border-2 border-foreground items-center bg-card !rounded-full -mt-[5px] w-[80px] h-[80px] z-50" onPress={scan}>
                <View className="!py-5">
                    <QrCode size={24} color={colors.foreground} />
                </View>
            </Button>
            <Button variant="secondary" className="grow items-center bg-foreground -ml-[25px] h-[65px]" onPress={send}>
                <Text className="py-2 text-background font-bold text-lg uppercase">Send</Text>
            </Button>
        </View>
    )
}