import {
    NDKCashuMintList,
    NDKKind,
    type NDKUser,
    useNDKCurrentUser,
    useNDKSessionEventKind,
    useNDKWallet,
    useUserProfile,
} from '@nostr-dev-kit/ndk-mobile';
import {
    NDKCashuWallet,
    type NDKNWCGetInfoResult,
    NDKNWCWallet,
    type NDKWallet,
} from '@nostr-dev-kit/ndk-wallet';
import { Stack, router } from 'expo-router';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { QrCode, Settings, SettingsIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    Pressable,
    type StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as User from '@/components/ui/user';
import WalletBalance from '@/components/ui/wallet/WalletBalance';
import NWCListTansactions from '@/components/wallet/nwc/list-transactions';
import TransactionHistory from '@/components/wallet/transactions/list';
import { useColorScheme } from '@/lib/useColorScheme';

const nwcInfoAtom = atom<NDKNWCGetInfoResult | null, [NDKNWCGetInfoResult | null], null>(
    null,
    (_get, set, value) => set(nwcInfoAtom, value)
);
const walletTitleAtom = atom<string | null, [string | null], void>(null, (_get, set, value) =>
    set(walletTitleAtom, value)
);

function WalletNWC({ wallet }: { wallet: NDKNWCWallet }) {
    const [_info, setInfo] = useAtom(nwcInfoAtom);
    const setWalletTitle = useSetAtom(walletTitleAtom);
    const [showTimeoutError, setShowTimeoutError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const timeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        wallet.updateBalance();
    }, [wallet?.walletId]);

    useEffect(() => {
        timeout.current = setTimeout(() => {
            setShowTimeoutError(true);
        }, 10000);

        wallet
            .getInfo()
            .then((info) => {
                setInfo(info);
                setWalletTitle(info.alias);
                if (timeout.current) {
                    clearTimeout(timeout.current);
                    timeout.current = null;
                }
            })
            .catch((_e) => {});

        return () => {
            if (timeout.current) {
                clearTimeout(timeout.current);
                timeout.current = null;
            }
        };
    }, [wallet?.walletId, retryCount]);

    // if (!info) {
    //     return <ActivityIndicator />
    // }

    if (showTimeoutError) {
        return (
            <View className="absolute left-0 right-0 top-0 flex-1 bg-red-500 p-3 text-white">
                <Text className="text-white">Timeout error</Text>
                <Pressable
                    onPress={() => {
                        setShowTimeoutError(false);
                        setRetryCount(retryCount + 1);
                        wallet.getInfo();
                    }}
                >
                    <Text className="font-bold text-white">Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View className="flex-1">
            <NWCListTansactions />
        </View>
    );
}

function WalletNip60({ wallet }: { wallet: NDKCashuWallet }) {
    return (
        <View className="h-full min-h-[100px] flex-1 flex-col">
            <TransactionHistory wallet={wallet} />
        </View>
    );
}

export default function WalletScreen() {
    const currentUser = useNDKCurrentUser();
    const { activeWallet, balance } = useNDKWallet();
    const mintList = useNDKSessionEventKind<NDKCashuMintList>(NDKKind.CashuMintList, {
        create: NDKCashuMintList,
    });
    const [isTestnutWallet, setIsTestnutWallet] = useState(false);

    useEffect(() => {
        if (!activeWallet) return;

        if (
            activeWallet instanceof NDKCashuWallet &&
            activeWallet.mints?.some((m) => m.match(/testnut\.cashu/))
        ) {
            setIsTestnutWallet(true);
        }
    }, [mintList?.id]);

    const onLongPress = useCallback(() => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;
        const _dump = activeWallet.state.dump();
    }, [activeWallet?.walletId]);

    const { colors } = useColorScheme();
    const walletTitle = useAtomValue(walletTitleAtom);

    const insets = useSafeAreaInsets();

    const profileData = useUserProfile(currentUser?.pubkey);
    const _userProfile = profileData?.userProfile;

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    title: walletTitle,
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => router.push('/(home)/(wallet)/(walletSettings)')}
                        >
                            <SettingsIcon size={24} color={colors.foreground} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
                <View className="flex-1 flex-col">
                    <View className="grow flex-col">
                        {isTestnutWallet && (
                            <Pressable
                                className="ios:rounded-t-md flex-row items-center justify-center bg-red-500/30 p-4"
                                onPress={() => {
                                    router.push('/(home)/(wallet)/(walletSettings)/mints');
                                }}
                            >
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

                        <View style={{ paddingTop: 50, paddingBottom: 10 }}>
                            <WalletBalance
                                amount={balance?.amount}
                                unit="sats"
                                onPress={() => activeWallet?.updateBalance?.()}
                                onLongPress={onLongPress}
                            />
                        </View>

                        {/* {activeWallet instanceof NDKNWCWallet && <WalletNWC wallet={activeWallet} />} */}
                        {activeWallet instanceof NDKCashuWallet && (
                            <>
                                <Footer activeWallet={activeWallet} currentUser={currentUser} />
                                <WalletNip60 wallet={activeWallet} />
                            </>
                        )}

                        {activeWallet instanceof NDKNWCWallet && (
                            <WalletNWC wallet={activeWallet} />
                        )}
                    </View>
                </View>
            </View>
        </>
    );
}

function HeaderLeft() {
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const profileData = useUserProfile(currentUser?.pubkey);
    const userProfile = profileData?.userProfile;

    return (
        <TouchableOpacity className="ml-2" onPress={() => router.push('/(home)/(settings)')}>
            {currentUser && userProfile?.picture ? (
                <User.Avatar pubkey={currentUser.pubkey} userProfile={userProfile} imageSize={24} />
            ) : (
                <Settings size={24} color={colors.muted} className="h-10 w-10" />
            )}
        </TouchableOpacity>
    );
}

function Footer({ activeWallet, currentUser }: { activeWallet: NDKWallet; currentUser: NDKUser }) {
    if (activeWallet) {
        return <WalletButtons />;
    } else if (currentUser) {
        return <Text>Bug: You don't have a wallet; how did you get here?</Text>;
    } else {
        return <Text>Not logged in!</Text>;
    }
}

function WalletButtons() {
    const receive = () => router.push('/receive');
    const send = () => router.push('/send');
    const scan = () => router.push('/scan');
    const { colors } = useColorScheme();

    const width = Dimensions.get('window').width / 2 - 20;

    const buttonStyle = useMemo<StyleProp<ViewStyle>>(
        () => ({
            ...buttonStyles.button,
            backgroundColor: colors.foreground,
            width,
        }),
        [colors.card]
    );

    const scannerButtonStyle = useMemo<StyleProp<ViewStyle>>(
        () => ({
            ...buttonStyles.scannerButton,
            borderWidth: 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            left: width - 30,
            borderColor: colors.foreground,
            backgroundColor: colors.background,
            borderRadius: 80,
            width: 90,
            height: 90,
            zIndex: 100,
        }),
        [colors.card]
    );

    return (
        <View style={buttonStyles.container}>
            <TouchableOpacity style={[buttonStyle, { left: 0 }]} onPress={receive}>
                <Text className="py-2 text-lg font-bold uppercase text-background">Receive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={scannerButtonStyle} onPress={scan}>
                <View className="!py-5">
                    <QrCode size={24} color={colors.foreground} />
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={[buttonStyle, { right: 0 }]} onPress={send}>
                <Text className="py-2 text-lg font-bold uppercase text-background">Send</Text>
            </TouchableOpacity>
        </View>
    );
}

const buttonStyles = StyleSheet.create({
    container: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        padding: 10,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        height: 70,
    },
    scannerButton: {},
});
