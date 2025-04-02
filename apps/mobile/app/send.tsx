import { toast } from '@backpackapp-io/react-native-toast';
import {
    type CashuPaymentInfo,
    type Hexpubkey,
    type NDKLnLudData,
    NDKUser,
    type NDKZapMethod,
    type NDKZapMethodInfo,
    NDKZapper,
    useFollows,
    useNDK,
    useNDKCurrentUser,
    useNDKWallet,
    useProfile,
} from '@nostr-dev-kit/ndk-mobile';
import type { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonProps, type ButtonState } from '@/components/nativewindui/Button';
import { List, ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import * as User from '@/components/ui/user';
import WalletBalance from '@/components/ui/wallet/WalletBalance';
import { useColorScheme } from '@/lib/useColorScheme';
import { usePaymentStore } from '@/stores/payments';
export function UserAsHeader({ pubkey }: { pubkey: Hexpubkey }) {
    const userProfile = useProfile(pubkey);
    return (
        <View className="flex-1 flex-col items-center gap-2">
            <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={100} />
            <Text className="text-xl font-bold">
                <User.Name userProfile={userProfile} pubkey={pubkey} />
            </Text>
        </View>
    );
}

function SendToUser({ pubkey, onCancel }: { pubkey: Hexpubkey; onCancel: () => void }) {
    const { ndk } = useNDK();
    const { activeWallet } = useNDKWallet();
    const inputRef = useRef<TextInput | null>(null);
    const [amount, setAmount] = useState(21);
    const user = useMemo(() => ndk?.getUser({ pubkey }), [pubkey, ndk]);

    if (!user) {
        // Handle case where user couldn't be fetched (e.g., ndk is null or getUser failed)
        console.error(`Could not get user object for pubkey: ${pubkey}`);
        toast.error("Failed to load user data.");
        // Optionally, return a loading or error state, or null
        return null;
    }

    const [note, setNote] = useState('');

    const zap = useMemo(
        () =>
            new NDKZapper(user, 0, 'msat', {
                comment: note ?? 'Sending from Olas',
                nutzapAsFallback: true,
            }),
        [pubkey, amount, note]
    );
    const [methods, setMethods] = useState<Map<NDKZapMethod, NDKZapMethodInfo>>(new Map());
    const [buttonState, setButtonState] = useState<ButtonState>('idle');
    const { addPendingPayment } = usePaymentStore();
    const currentUser = useNDKCurrentUser();

    useEffect(() => {
        zap.amount = amount * 1000;
        if (ndk) {
            zap.getZapMethods(ndk, pubkey).then(setMethods);
        }
    }, [pubkey]);

    async function send() {
        setButtonState('loading');
        zap.amount = amount * 1000;
        zap.once('complete', (_results) => {
            setButtonState('success');
        });
        zap.zap();
        if (currentUser?.pubkey) {
            addPendingPayment(zap, currentUser.pubkey);
        } else {
            console.error("Cannot add pending payment: current user pubkey not found.");
            toast.error("Error initiating payment: User not identified.");
            setButtonState('idle'); // Reset button state if sender is missing
            return; // Prevent further execution
        }
        setTimeout(() => {
            router.back();
        }, 500);
    }

    const inset = useSafeAreaInsets();

    return (
        <KeyboardAwareScrollView>
            <View
                className="w-full flex-1 flex-col items-center gap-2 pt-5"
                style={{ marginTop: Platform.OS === 'android' ? inset.top : 0 }}
            >
                <View className="absolute w-full flex-1 flex-row items-center justify-between gap-2 p-2">
                    <Button variant="plain" className="w-fit" onPress={onCancel}>
                        <Text className="text-base text-muted-foreground">Cancel</Text>
                    </Button>

                    <Button variant="plain" state={buttonState} onPress={send}>
                        <Text className="">Send</Text>
                    </Button>
                </View>

                <UserAsHeader pubkey={pubkey} />

                <View className="w-full flex-1 flex-col items-stretch gap-2 px-4">
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
                        unit={'sat'}
                        onPress={() => inputRef.current?.focus()}
                    />

                    <TextInput
                        className="m-4 grow rounded-lg bg-card p-2 text-base text-foreground"
                        placeholder="The medium is the message... but you can also write an actual message"
                        multiline
                        numberOfLines={4}
                        value={note}
                        onChangeText={setNote}
                    />

                    <Button
                        variant="secondary"
                        className="grow items-center bg-foreground"
                        onPress={send}
                        state={buttonState}
                    >
                        <Text className="py-2 font-mono text-lg font-bold uppercase !text-background">
                            Send
                        </Text>
                    </Button>
                </View>

                <View className="flex w-full flex-col gap-2">
                    {Array.from(methods.entries()).map(([method, info]) => (
                        <View key={method} className="mx-4">
                            <Text className="py-2 text-xl font-bold">{method.toUpperCase()}</Text>

                            {method === 'nip61' && (
                                <View className="flex flex-col gap-2">
                                    {(info as CashuPaymentInfo)?.mints?.map((mint) => {
                                        return (
                                            <Text
                                                key={mint}
                                                className="text-sm text-muted-foreground"
                                            >
                                                {mint}
                                            </Text>
                                        );
                                    })}
                                </View>
                            )}

                            {method === 'nip57' && (
                                <View className="flex flex-col gap-2">
                                    <Text className="py-2 text-base font-medium">
                                        {(info as NDKLnLudData).lud06 ??
                                            (info as NDKLnLudData).lud16}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
}

function FollowItem({
    index,
    target, // Destructure target here
    item,
    onPress,
}: { index: number; target: any; item: string; onPress: () => void }) {
    const userProfile = useProfile(item);

    return (
        <ListItem
            target={target}
            index={index}
            item={{
                title: '', // Title is set via User.Name in leftView
            }}
            leftView={
                <View className="flex-row items-center py-2">
                    <User.Avatar
                        pubkey={item}
                        imageSize={16}
                        userProfile={userProfile}
                        className="mr-2 h-10 w-10"
                    />
                    <User.Name
                        userProfile={userProfile}
                        pubkey={item}
                        className="text-lg text-foreground"
                    />
                </View>
            }
            onPress={onPress}
        />
    );
}

export default function SendView() {
    const { ndk } = useNDK();
    const follows = useFollows();
    const [search, setSearch] = useState('');
    const [selectedPubkey, setSelectedPubkey] = useState<Hexpubkey | null>(null);
    const inset = useSafeAreaInsets();
    const { colors } = useColorScheme();

    const onPress = useCallback(
        (pubkey: Hexpubkey) => {
            setSelectedPubkey(pubkey);
        },
        [setSelectedPubkey]
    );

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
        return <SendToUser pubkey={selectedPubkey} onCancel={() => setSelectedPubkey(null)} />;
    }

    async function getUser() {
        if (search.startsWith('npub')) {
            try {
                const user = ndk?.getUser({ npub: search });
                if (!user) throw new Error('User not found from npub');
                setSelectedPubkey(user.pubkey);
                return;
            } catch (error) {
                console.error(error);
            }
        }

        try {
            if (!ndk) throw new Error('NDK not available');
            const user = await NDKUser.fromNip05(search, ndk);
            if (user) {
                setSelectedPubkey(user.pubkey);
                return;
            }
        } catch {}

        toast.error("Couldn't find anyone with that");
    }

    return (
        <>
            <View
                className="flex-1"
                style={{ paddingTop: Platform.OS === 'android' ? inset.top : 0 }}
            >
                <View className="flex-row items-center gap-2 pr-4">
                    <TextInput
                        className="bg-muted/40 m-4 grow rounded-lg p-2 text-base text-foreground"
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
                            target={target} // Pass target here
                            item={item}
                            onPress={() => onPress(item)}
                        />
                    )}
                />
            </View>
        </>
    );
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
