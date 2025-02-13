import { List, ListItem } from "@/components/nativewindui/List";
import { Platform, StyleSheet } from "react-native";
import { CashuPaymentInfo, Hexpubkey, NDKKind, NDKLnLudData, NDKLnUrlData, NDKUser, NDKUserProfile, NDKZapMethod, NDKZapMethodInfo, NDKZapper, useFollows, useNDK, useNDKSession, useNDKWallet, useSubscribe, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { TextInput, TouchableOpacity, View, KeyboardAvoidingView } from "react-native";
import * as User from "@/components/ui/user"
import { Text } from "@/components/nativewindui/Text";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ButtonProps, ButtonState } from "@/components/nativewindui/Button";
import WalletBalance from "@/components/ui/wallet/WalletBalance";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { router, Stack } from "expo-router";
import { toast } from "@backpackapp-io/react-native-toast";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import { usePaymentStore } from "@/stores/payments";
export function UserAsHeader({ pubkey }: { pubkey: Hexpubkey }) {
    const { userProfile } = useUserProfile(pubkey);
    return (
        <View className="flex-1 flex-col items-center gap-2">
            <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={100} />
            <Text className="text-xl font-bold">
                <User.Name userProfile={userProfile} pubkey={pubkey} />
            </Text>
        </View>
    )
}

function SendToUser({ pubkey, onCancel }: { pubkey: Hexpubkey, onCancel: () => void }) {
    const { ndk } = useNDK();
    const { activeWallet } = useNDKWallet();
    const inputRef = useRef<TextInput | null>(null);
    const [amount, setAmount] = useState(21);
    const user = useMemo(() => ndk.getUser({ pubkey }), [pubkey]);

    const [note, setNote] = useState('');
    
    const zap = useMemo(() => new NDKZapper(user, 0, 'msat', {
        comment: note ?? "Sending from Olas",
        nutzapAsFallback: true,
    }), [pubkey, amount, note]);
    const [methods, setMethods] = useState<Map<NDKZapMethod, NDKZapMethodInfo>>(new Map());
    const [buttonState, setButtonState] = useState<ButtonState>('idle');
    const { addPendingPayment } = usePaymentStore();

    useEffect(() => {
        zap.amount = amount * 1000;
        zap.getZapMethods(ndk, pubkey).then(setMethods);
    }, [pubkey]);

    async function send() {
        setButtonState('loading');
        zap.amount = amount * 1000;
        zap.once("complete", (results) => {
            setButtonState('success');
        });
        zap.zap();
        addPendingPayment(zap);
        setTimeout(() => {
            router.back();
        }, 500);
    }

    const inset = useSafeAreaInsets();

    return (
        <KeyboardAwareScrollView>
            <View className="flex-1 flex-col items-center gap-2 pt-5 w-full" style={{ marginTop: Platform.OS === 'android' ? inset.top : 0 }}>
                <View className="flex-1 flex-row items-center w-full justify-between gap-2 p-2 absolute">
                    <Button variant="plain" className="w-fit" onPress={onCancel}>
                        <Text className="text-base text-muted-foreground">Cancel</Text>
                    </Button>

                    <Button variant="plain" state={buttonState} onPress={send}>
                        <Text className="">Send</Text>
                    </Button>
                </View>

                <UserAsHeader pubkey={pubkey} />

            <View className="flex-1 flex-col items-stretch w-full px-4 gap-2">
                <TextInput
                    ref={inputRef}
                    keyboardType="numeric" 
                    autoFocus
                    style={styles.input} 
                    value={amount.toString()}
                    onChangeText={(text) => setAmount(Number(text))}
                />

                <WalletBalance
                    amount={amount}
                    unit={(activeWallet as NDKCashuWallet).unit}
                    onPress={() => inputRef.current?.focus()}
                />
                
                <TextInput
                    className="text-base bg-card text-foreground m-4 rounded-lg p-2 grow"
                    placeholder="The medium is the message... but you can also write an actual message"
                    multiline
                    numberOfLines={4}
                    value={note}
                    onChangeText={setNote}
                />

                <Button variant="secondary" className="grow items-center bg-foreground" onPress={send} state={buttonState}>
                    <Text className="py-2 !text-background font-mono font-bold text-lg uppercase">Send</Text>
                </Button>
            </View>

            <View className="flex flex-col gap-2 w-full">
                {Array.from(methods.entries()).map(([method, info]) => (
                    <View key={method} className="mx-4">
                        <Text className="text-xl font-bold py-2">{method.toUpperCase()}</Text>

                        {method === 'nip61' && (
                            <View className="flex flex-col gap-2">
                                {(info as CashuPaymentInfo).mints.map((mint) => {
                                    return <Text key={mint} className="text-sm text-muted-foreground">{mint}</Text>
                                })}
                            </View>
                        )}

                        {method === 'nip57' && (
                            <View className="flex flex-col gap-2">
                                <Text className="text-base font-medium py-2">{(info as NDKLnLudData).lud06 ?? (info as NDKLnLudData).lud16}</Text>
                            </View>
                        )}
                    </View>
                ))}
            </View>

            </View>
        </KeyboardAwareScrollView>
    )
}

function FollowItem({ index, target, item, onPress }: { index: number, target: ListItemTarget, item: string, onPress: () => void }) {
    const {userProfile} = useUserProfile(item);

    return <ListItem
        index={index}
        target={target}
        item={{
            id: item,
            title: ""
        }}
        leftView={<View className="flex-row items-center py-2">
            <User.Avatar pubkey={item} imageSize={16} userProfile={userProfile} className="w-10 h-10 mr-2" />
            <User.Name userProfile={userProfile} pubkey={item} className="text-lg text-foreground" />
        </View>}
        onPress={onPress}
    />
}

export default function SendView() {
    const { ndk } = useNDK();
    const follows = useFollows();
    const [search, setSearch] = useState('');
    const [selectedPubkey, setSelectedPubkey] = useState<Hexpubkey | null>(null);
    const inset = useSafeAreaInsets();
    const { colors } = useColorScheme();

    console.log({selectedPubkey});

    const onPress = useCallback((pubkey: Hexpubkey) => {
        console.log('pubkey', pubkey);
        setSelectedPubkey(pubkey);
    }, [setSelectedPubkey]);

    // const mintlistFilter = useMemo(() => [{ kinds: [0, NDKKind.CashuMintList], authors: Array.from(new Set([...follows, ...myFollows])) }], [follows]);
    // const opts = useMemo(() => ({ groupable: false, closeOnEose: true }), []);
    // const { events: mintlistEvents } = useSubscribe({ filters: mintlistFilter, opts });

    // const usersWithMintlist = useMemo(() => {
    //     const pubkeysWithKind0 = new Set<Hexpubkey>(
    //         mintlistEvents.filter(e => e.kind === 0).map(e => e.pubkey)
    //     );

    //     return mintlistEvents
    //         .filter(e => pubkeysWithKind0.has(e.pubkey))
    //         .filter(e => e.kind === NDKKind.CashuMintList)
    //         .map((event) => event.pubkey);
    // }, [mintlistEvents]);

    if (selectedPubkey) {
        return (<SendToUser pubkey={selectedPubkey} onCancel={() => setSelectedPubkey(null)} />)
    }

    async function getUser() {
        if (search.startsWith('npub')) {
            try {
                const user = ndk.getUser({ npub: search });
                setSelectedPubkey(user.pubkey);
                return;
            } catch (error) {
                console.error(error);
            }
        }

        try {
            const user = await NDKUser.fromNip05(search, ndk);
            if (user) {
                setSelectedPubkey(user.pubkey);
                return;
            }
        } catch { }

        toast.error("Couldn't find anyone with that");
    }

    return (
        <>
            <View className="flex-1" style={{ paddingTop: Platform.OS === 'android' ? inset.top : 0 }}>
                <View className="flex-row gap-2 items-center pr-4">
                    <TextInput
                        className="text-base bg-muted/40 text-foreground m-4 rounded-lg p-2 grow"
                        placeholder="Enter a Nostr address or npub"
                        value={search}
                        onChangeText={setSearch}
                    />

                    <TouchableOpacity onPress={getUser}>
                        <Search size={24} color={colors.foreground} />
                    </TouchableOpacity>
                </View>

                <List
                    data={follows}
                    keyExtractor={(item) => item}
                    estimatedItemSize={56}
                    variant="insets"
                    renderItem={({ index, target, item }) => (
                        <FollowItem
                            index={index}
                            target={target}
                            item={item}
                            onPress={() => onPress(item)}
                        />
                    )}
                />
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    input: {
        fontSize: 10,
        width: 0,
        textAlign: 'center',
        fontWeight: 'bold',
        backgroundColor: 'transparent',
    },
});