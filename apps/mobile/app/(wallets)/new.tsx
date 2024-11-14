import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNDK, useSubscribe } from "@/ndk-expo";
import { NDKCashuMintList, NDKEvent, NDKKind, NDKList, NDKPrivateKeySigner, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import MintListItem from '@/components/cashu/mint/list/item';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import { router } from 'expo-router';
import { useNDKSession } from '@/ndk-expo/hooks/session';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';

const NewWalletPage = () => {
    const { ndk } = useNDK();
    const [walletName, setWalletName] = useState('');
    const [relayUrls, setRelayUrls] = useState<string[]>(ndk?.pool.connectedRelays().map(r => r.url).filter(u => !!u) || []);
    const filter = useMemo(() => ([{ kinds: [38172], limit: 50 }]), [1]);
    const opts = useMemo(() => ({ cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY, groupable: false, closeOnEose: false, subId: 'mints' }), []);
    const { events: mintList } = useSubscribe({ filters: filter, opts });
    const { follows } = useNDKSession();
    // const { events: followMintLists } = useSubscribe({
    //     filters: { kinds: [NDKKind.CashuMintList], authors: follows },
    //     klass: NDKList
    // });
    const [selectedMints, setSelectedMints] = useState<{ [key: string]: boolean }>({});

    // count of how many of the mints appear in the follow mint lists
    // const [ usedMints, setUsedMints ] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        console.log("mintList", mintList)
    }, [mintList])

    // useEffect(() => {
    //     const mintMap = new Map();
    //     followMintLists.forEach(list => {
    //         console.log(list.rawEvent())
    //         list.tags.forEach(tag => {
    //             if (tag[0] === 'mint' && tag[1]) {
    //                 mintMap.set(tag[1], (mintMap.get(tag[1]) || 0) + 1);
    //             }
    //         });
    //     });

    //     console.log(mintMap)
    //     setUsedMints(mintMap);
    // }, [followMintLists]);

    const handleMintSelect = (url: string) => {
        setSelectedMints(prev => ({ ...prev, [url]: !prev[url] }));
    };

    const handleRelayUrlChange = (index: number, url: string) => {
        const newRelayUrls = [...relayUrls];
        newRelayUrls[index] = url;
        setRelayUrls(newRelayUrls);
    };

    const addRelayUrl = () => {
        setRelayUrls([...relayUrls.filter(u => u.trim().length > 0), '']);
    };

    const createWallet = async () => {
        if (!ndk) return;
        const wallet = new NDKCashuWallet(ndk);
        wallet.name = walletName;
        wallet.mints = Object.entries(selectedMints)
            .filter(([url, selected]) => selected)
            .map(([url]) => url);
        wallet.relays = relayUrls;
        wallet.privkey = NDKPrivateKeySigner.generate().privateKey;
        await wallet.getP2pk()
        await wallet.publish();

        const mintList = new NDKCashuMintList(ndk);
        mintList.mints = wallet.mints;
        mintList.p2pk = wallet.p2pk;
        await mintList.publish();

        router.push('/')
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TextInput
                    style={styles.walletNameInput}
                    placeholder="Wallet Name"
                    value={walletName}
                    onChangeText={setWalletName}
                />

                <Button onPress={createWallet} title="Save" />

            </View>
            <Text style={styles.label}>Select your mints</Text>
            <Text>{mintList.length}</Text>
            <FlashList
                data={mintList}
                estimatedItemSize={200}
                renderItem={({ item }) => {
                    const url = item.tagValue("u")
                    if (!url) return null;
                    return (
                        <MintListItem
                            item={item}
                            selected={!!selectedMints[url]}
                            onSelect={() => handleMintSelect(url)}
                        />
                    );
                }}
                keyExtractor={item => item.id}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.label}>Select your relays</Text>
                <Button title="Add" onPress={addRelayUrl} />
            </View>
            {relayUrls.map((url, index) => (
                <TextInput
                    key={index}
                    style={styles.input}
                    placeholder="Relay URL"
                    value={url}
                    autoCapitalize="none"
                    keyboardType='url'
                    onChangeText={text => handleRelayUrlChange(index, text)}
                />
            ))}
        </View>
    );
};

export default NewWalletPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
    },
    walletNameInput: { // Updated style for TextInput
        borderColor: 'transparent', // No border
        borderWidth: 0, // No border
        borderRadius: 0, // No border radius
        marginBottom: 10,
        fontSize: 18, // Increased font size
        fontWeight: '600',
        backgroundColor: 'transparent', // No background
    },
    input: {
        fontSize: 18,
        color: 'gray',
        marginBottom: 10,
    },
    button: { // New style for Button
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginVertical: 5,
    },
    buttonText: { // New style for Button text
        textAlign: 'center',
        fontWeight: 'bold',
    },
    label: { // New style for the label
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: 'pink',
        borderRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginVertical: 5,
    }
});