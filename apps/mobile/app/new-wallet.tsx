import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useNDK, useSubscribe } from "@/ndk-expo";
import { NDKCashuMintList, NDKEvent, NDKKind, NDKList, NDKPrivateKeySigner, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
import MintListItem from '@/components/cashu/mint/list/item';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import { router, Stack } from 'expo-router';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { List } from '@/components/nativewindui/List';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface RelayViewProps {
    relayUrls: string[];
    onRelayUrlChange: (index: number, url: string) => void;
    addRelayUrl: () => void;
}

const RelayView: React.FC<RelayViewProps> = ({ relayUrls, onRelayUrlChange, addRelayUrl }) => {
    return (
        <View className='flex-1 flex-col'>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.label}>Relays</Text>
                <Button onPress={addRelayUrl}>
                    <Text>Add</Text>
                </Button>
            </View>
            <List
                data={relayUrls}
                estimatedItemSize={50}
                renderItem={({ item, index }) => (
                    <TextInput
                        key={index}
                        style={styles.input}
                        placeholder="Relay URL"
                        value={item}
                        autoCapitalize="none"
                        keyboardType='url'
                        onChangeText={text => onRelayUrlChange(index, text)}
                    />
                )}
            />
        </View>
    )
}

interface MintsViewProps {
    mintList: NDKEvent[];
    selectedMints: { [key: string]: boolean };
    onMintSelect: (url: string) => void;
}

const MintsView: React.FC<MintsViewProps> = ({ mintList, selectedMints, onMintSelect }) => {
    return (
        <View className='flex-1'>
            <Text style={styles.label}>Select your mints {mintList.length}</Text>
            <List
                data={mintList}
                estimatedItemSize={200}
                renderItem={({ item }) => {
                    const url = item.tagValue("u")
                    if (!url) return null;
                    return (
                        <MintListItem
                            item={item}
                            selected={!!selectedMints[url]}
                            onSelect={() => onMintSelect(url)}
                        />
                    );
                }}
                keyExtractor={item => item.id}
            />
        </View>
    )
}

const NewWalletPage: React.FC = () => {
    const { ndk } = useNDK();
    const [walletName, setWalletName] = useState<string>('');
    const [relayUrls, setRelayUrls] = useState<string[]>(ndk?.pool.connectedRelays().map(r => r.url).filter(u => !!u) || []);
    const [selectedMints, setSelectedMints] = useState<{ [key: string]: boolean }>({});
    const filter = useMemo(() => ([{ kinds: [38172], limit: 50 }]), [1]);
    const opts = useMemo(() => ({ groupable: false, closeOnEose: false, subId: 'mints' }), []);
    const { events: mintList } = useSubscribe({ filters: filter, opts });

    const handleRelayUrlChange = (index: number, url: string) => {
        const newRelayUrls = [...relayUrls];
        newRelayUrls[index] = url;
        setRelayUrls(newRelayUrls);
    };

    const addRelayUrl = () => {
        setRelayUrls([...relayUrls.filter(u => u.trim().length > 0), '']);
    };

    const handleMintSelect = (url: string) => {
        setSelectedMints(prev => ({ ...prev, [url]: !prev[url] }));
    };

    const createWallet = useCallback(async () => {
        if (!ndk) return;
        console.log('creating wallet', walletName, relayUrls, selectedMints);
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
    }, [ndk, walletName, relayUrls, selectedMints]);

    const [activeView, setActiveView] = useState<'mints' | 'relays'>('mints');

    const nextClicked = useCallback(() => {
        if (activeView === 'mints') setActiveView('relays');
        if (activeView === 'relays') createWallet();
    }, [activeView, createWallet]);

    const buttonLabel = useMemo(() => {
        if (activeView === 'mints') return 'Next';
        if (activeView === 'relays') return 'Create';
    }, [activeView]);

    return (
        <View style={styles.container} className='bg-card'>
            <Stack.Screen options={{
                headerTitle: '',
                headerLeft: () => (
                    <View className='flex-row items-center'>
                        <TextInput
                            style={styles.walletNameInput}
                            className='text-primary border-2 border-red-500'
                            placeholder="Wallet Name"
                            value={walletName}
                            onChangeText={setWalletName}
                        />
                    </View>
                ),
                headerRight: () => <TouchableOpacity onPress={nextClicked}>
                    <Text className='text-primary'>{buttonLabel}</Text>
                </TouchableOpacity>,
            }} />

            {activeView === 'mints' && <MintsView mintList={mintList} selectedMints={selectedMints} onMintSelect={handleMintSelect} />}
            {activeView === 'relays' && <RelayView relayUrls={relayUrls} onRelayUrlChange={handleRelayUrlChange} addRelayUrl={addRelayUrl} />}
            
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