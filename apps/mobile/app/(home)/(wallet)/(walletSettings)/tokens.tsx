import {
    NDKCashuToken,
    NDKCashuMintList,
    NDKKind,
    useNDKCurrentUser,
    useNDKSessionEventKind,
    useNDKWallet,
    useSubscribe,
} from '@nostr-dev-kit/ndk-mobile';
import { consolidateMintTokens, NDKCashuWallet, ProofEntry, WalletProofChange } from '@nostr-dev-kit/ndk-wallet';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { atom, useAtom, useSetAtom } from 'jotai';
import { Check, Delete, Trash } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, ScrollView, View, StyleSheet } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import { useMintInfo } from '@/hooks/mint';
import { useColorScheme } from '@/lib/useColorScheme';

export default function TokensScreen() {
    const { activeWallet } = useNDKWallet();

    if (!(activeWallet instanceof NDKCashuWallet)) {
        return <Text>This wallet is not a NIP-60 wallet</Text>;
    }

    const tokens = activeWallet.state.getTokens();

    const [forceSyncing, setForceSyncing] = useState(false);

    const forceSync = useCallback(() => {
        setForceSyncing(true);
    }, []);

    if (forceSyncing) {
        return <ForceSync />;
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Coins',
                    headerShown: true,
                    headerRight: () => (
                        <Pressable onPress={forceSync}>{forceSyncing ? <ActivityIndicator /> : <Text>Force-Sync</Text>}</Pressable>
                    ),
                }}
            />

            <FlashList
                data={Array.from(tokens.values()).filter((t) => !!t.tokenId)}
                keyExtractor={(item) => item.tokenId}
                renderItem={({ item }) => (
                    <TokenItem tokenId={item.tokenId} token={item.token} mint={item.mint} proofEntries={item.proofEntries} />
                )}
            />
        </>
    );
}

function walletProofChangeToText(res: WalletProofChange) {
    const text = [];
    if (res.destroy?.length) {
        text.push(`${res.destroy.length} coins deleted`);
    }
    if (res.store?.length) text.push(`${res.store.length} valid coins`);
    return text.join(', ');
}

function InspectButton({ token }: { token: NDKCashuToken }) {
    const [inspect, setInspect] = useState(false);
    const [content, setContent] = useState<string | null>(token?.content ?? '{}');
    const [payload, setPayload] = useState<string | null>(null);

    useEffect(() => {
        setContent(token?.content ?? null);
    }, [inspect, token?.id]);

    useEffect(() => {
        if (inspect && content) {
            try {
                const val = JSON.parse(content);
                setPayload(JSON.stringify(val, null, 4));
            } catch (e) {
                token.decrypt().then(() => {
                    setContent(token.content);
                });
            }
        }
    }, [inspect, content]);

    if (inspect) {
        return (
            <Modal visible={inspect} onDismiss={() => setInspect(false)}>
                <SafeAreaView>
                    <Pressable onPress={() => setInspect(false)}>
                        <Text>Close</Text>
                    </Pressable>
                    <ScrollView>
                        <Text>{payload}</Text>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        );
    }

    if (!token) return null;

    return (
        <Button variant="tonal" onPress={() => setInspect(true)}>
            <Text>Inspect</Text>
        </Button>
    );
}

const itemStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
});

const openTokenIdAtom = atom<string | null, [string | null], void>(null);

function TokenItem({
    tokenId,
    token,
    mint,
    proofEntries,
}: {
    tokenId: string;
    token?: NDKCashuToken;
    mint: string;
    proofEntries: ProofEntry[];
}) {
    const { mintInfo, loading } = useMintInfo(mint);
    const [statusUpdate, setStatusUpdate] = useState<string | null>(null);
    const { activeWallet } = useNDKWallet();
    const [open, setOpen] = useAtom(openTokenIdAtom);
    const amount = proofEntries.reduce((acc, { proof }) => acc + proof.amount, 0);
    const relays = new Set(token?.onRelays?.map((r) => r.url));
    const { colors } = useColorScheme();

    const isOpen = useMemo(() => open === tokenId, [open, tokenId]);

    const handlePublish = async () => {
        setStatusUpdate('Publishing...');
        const res = await token!.publish();
        setStatusUpdate(
            res
                ? 'Published to ' +
                      Array.from(res)
                          .map((r) => r.url)
                          .join(', ')
                : 'Failed'
        );
    };

    const handleValidate = async () => {
        setStatusUpdate('Validating...');
        consolidateMintTokens(
            mint,
            activeWallet as NDKCashuWallet,
            proofEntries.map((p) => p.proof),
            (res) => {
                setStatusUpdate(walletProofChangeToText(res));
            },
            (error) => setStatusUpdate(`Failed to validate: ${error}`)
        );
    };

    const [showProofs, setShowProofs] = useState(false);

    const [inspect, setInspect] = useState(false);
    const handleInspect = async () => {
        setInspect(true);
    };

    return (
        <Swipeable renderRightActions={() => <RightActions event={token} />}>
            <View style={[itemStyles.container, { backgroundColor: colors.card }]} className="flex-col gap-4 p-2">
                <Pressable className="flex-1 flex-row items-center justify-between gap-2" onPress={() => setOpen(isOpen ? null : tokenId)}>
                    <Image source={{ uri: mintInfo?.icon_url }} style={{ width: 32, height: 32, borderRadius: 4 }} />

                    <View className="flex-1 flex-col">
                        <Text className="font-bold">{mintInfo?.name ?? mint}</Text>
                        <Text className="text-xs text-muted-foreground">{relays.size} relays</Text>
                    </View>
                    <View className="flex-col items-center">
                        <Text className="text-lg font-bold">{amount}</Text>
                        <Text className="text-sm text-muted-foreground">sats</Text>
                    </View>
                </Pressable>

                {isOpen && (
                    <View className="flex-col">
                        {Array.from(relays).map((relay) => (
                            <Text key={relay} className="text-sm text-muted-foreground">
                                {relay}
                            </Text>
                        ))}

                        {showProofs && (
                            <>
                                {proofEntries.map(({ proof }) => (
                                    <View className="flex-row" key={proof.C}>
                                        <Text className="flex-1 text-sm text-muted-foreground">Proof {proof.C.substring(0, 10)}</Text>
                                        <Text>{proof.amount}</Text>
                                    </View>
                                ))}
                            </>
                        )}

                        {statusUpdate && <Text>{statusUpdate}</Text>}

                        {token && (
                            <View className="flex-row justify-between">
                                <Button variant="tonal" onPress={handlePublish}>
                                    <Text>Publish</Text>
                                </Button>

                                <Button variant="tonal" onPress={() => setShowProofs(!showProofs)}>
                                    <Text>Proofs</Text>
                                </Button>

                                <InspectButton token={token} />

                                <Button variant="tonal" onPress={handleValidate}>
                                    <Text>Validate</Text>
                                </Button>
                            </View>
                        )}

                        <Text className="text-xs text-muted-foreground">{token?.encode() ?? tokenId}</Text>
                    </View>
                )}
            </View>
        </Swipeable>
    );
}

function RightActions({ event }: { event: NDKCashuToken }) {
    const setOpen = useSetAtom(openTokenIdAtom);

    const handleDelete = useCallback(() => {
        event.delete();
    }, [event?.id]);

    const handleValidate = useCallback(() => {
        setOpen(event.id);
    }, [event?.id]);
    return (
        <View style={rightActionStyles.container}>
            <Pressable style={[rightActionStyles.button, rightActionStyles.delete]} onPress={handleDelete}>
                <Trash size={24} color="white" />
                <Text className="text-xs text-white">Delete</Text>
            </Pressable>

            <Pressable style={[rightActionStyles.button, rightActionStyles.validate]} onPress={handleValidate}>
                <Check size={24} color="white" />
                <Text className="text-xs text-white">Validate</Text>
            </Pressable>
        </View>
    );
}

const rightActionStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        width: 75,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
    },
    delete: {
        backgroundColor: 'red',
        padding: 10,
    },
    validate: {
        backgroundColor: 'green',
        padding: 10,
    },
});

function ForceSync() {
    const currentUser = useNDKCurrentUser();
    const { events: tokenEvents } = useSubscribe<NDKCashuToken>([{ kinds: [NDKKind.CashuToken], authors: [currentUser?.pubkey] }], {
        wrap: true,
        skipVerification: true,
        closeOnEose: true,
    });
    const proofs = useMemo(() => {
        const proofs = new Map<string, { amount: number; proof: any }[]>();
        const knownProofs = new Set<string>();

        for (const token of tokenEvents) {
            for (const proof of token.proofs) {
                const proofId = proof.C + token.mint;
                if (knownProofs.has(proofId)) continue;
                const mint = token.mint;
                const amount = token.amount;
                const currentVal = proofs.get(mint) ?? [];
                currentVal.push({ amount, proof });
                proofs.set(mint, currentVal);
                knownProofs.add(proofId);
            }
        }

        return proofs;
    }, [tokenEvents.length]);

    const { events: deletedEvents } = useSubscribe(
        [{ kinds: [NDKKind.EventDeletion], '#k': [NDKKind.CashuToken.toString()], authors: [currentUser?.pubkey] }],
        { skipVerification: true, closeOnEose: true }
    );

    const deletedEventIds = useMemo(() => {
        const deletedIds = new Set<string>();
        const tokenIds = new Set<string>(tokenEvents.map((t) => t.id));

        for (const event of deletedEvents) {
            for (const id of event.tags.find(([k]) => k === 'e')?.slice(1)) {
                if (tokenIds.has(id)) deletedIds.add(id);
            }
        }

        for (const token of tokenEvents) {
            const delTag = token.getMatchingTags('del')?.[0];
            if (delTag) {
                for (const id of delTag.slice(1)) {
                    if (tokenIds.has(id)) deletedIds.add(id);
                }
            }
        }

        return deletedIds;
    }, [deletedEvents.length, tokenEvents.length]);

    return (
        <View>
            <Text>Force-Syncing...</Text>
            <Text>{tokenEvents.length} tokens found</Text>
            <Text>{deletedEventIds.size} deleted events found</Text>
            {Array.from(proofs.entries()).map(([mint, proofs]) => (
                <ForceSyncItem key={mint} mint={mint} proofs={proofs} />
            ))}
            <Text>{proofs.size} proofs found</Text>
        </View>
    );
}

function ForceSyncItem({ mint, proofs }: { mint: string; proofs: { amount: number; proof: any }[] }) {
    const { activeWallet } = useNDKWallet();
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    if (!(activeWallet instanceof NDKCashuWallet)) {
        return <Text>This wallet is not a NIP-60 wallet</Text>;
    }

    const startValidation = useCallback(async () => {
        setValidating(true);
        await consolidateMintTokens(
            mint,
            activeWallet,
            proofs.map((p) => p.proof),
            (res) => {
                const a = walletProofChangeToText(res);
                setResult(a);
            },
            (error) => setResult(`Failed to validate: ${error}`)
        );
        setValidating(false);
    }, []);

    return (
        <View key={mint}>
            <Text>
                {mint}: {proofs.length} coins
            </Text>
            {result ? (
                <Text>{result}</Text>
            ) : (
                <>
                    {validating ? (
                        <ActivityIndicator />
                    ) : (
                        <Button variant="outline" onPress={startValidation}>
                            <Text>Validate</Text>
                        </Button>
                    )}
                </>
            )}
        </View>
    );
}
