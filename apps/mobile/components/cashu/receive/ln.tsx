import { toast } from '@backpackapp-io/react-native-toast';
import { useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { NDKCashuWallet, NDKNWCWallet } from '@nostr-dev-kit/ndk-wallet';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import { atom, useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '@/components/nativewindui/Button';
import { Text } from '@/components/nativewindui/Text';
import WalletBalance from '@/components/ui/wallet/WalletBalance';

const selectedMintAtom = atom<string | null, [string | null], void>(null, (_get, set, mint) => {
    set(selectedMintAtom, mint);
});

export default function ReceiveLn({ onReceived }: { onReceived: () => void }) {
    const { activeWallet } = useNDKWallet();
    const [bolt11, setBolt11] = useState<string | null>(null);
    const selectedMint = useAtomValue(selectedMintAtom);
    const inputRef = useRef<TextInput | null>(null);
    const [amount, setAmount] = useState(1000);

    const handleContinue = useCallback(async () => {
        if (!selectedMint && activeWallet instanceof NDKCashuWallet) {
            console.error('No mint selected');
            return;
        }

        // hide keyboard
        Keyboard.dismiss();

        if (activeWallet instanceof NDKCashuWallet) {
            const deposit = (activeWallet as NDKCashuWallet).deposit(amount, selectedMint);

            deposit.on('success', (_token) => {
                onReceived();
            });

            try {
                const pr = await deposit.start();
                setBolt11(pr);
            } catch (e) {
                toast.error(e.message);
            }
        } else if (activeWallet instanceof NDKNWCWallet) {
            const res = await activeWallet.makeInvoice(amount * 1000, 'deposit');
            setBolt11(res.invoice);
        } else {
        }
    }, [activeWallet?.walletId, amount, selectedMint]);

    const [copied, setCopied] = useState(false);
    const copyToClipboard = useCallback(async () => {
        await Clipboard.setStringAsync(bolt11);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }, [bolt11]);

    const unit =
        activeWallet instanceof NDKCashuWallet ? (activeWallet as NDKCashuWallet).unit : 'sats';

    return (
        <KeyboardAvoidingView style={{ flex: 1 }}>
            <TextInput
                ref={inputRef}
                keyboardType="numeric"
                autoFocus
                style={styles.input}
                value={amount.toString()}
                onChangeText={(text) => setAmount(Number(text))}
            />

            {bolt11 ? ( // Conditionally render QR code
                <View className="w-full flex-col items-stretch justify-center gap-4 px-4">
                    <View style={styles.qrCodeContainer}>
                        <QRCode value={bolt11} size={350} />
                    </View>

                    <Button size="lg" variant="primary" onPress={copyToClipboard}>
                        <Text>{copied ? 'Copied' : 'Copy'}</Text>
                    </Button>
                </View>
            ) : (
                <>
                    <WalletBalance
                        amount={amount}
                        unit={unit}
                        onPress={() => inputRef.current?.focus()}
                    />
                    <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
                        <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>

                    {activeWallet instanceof NDKCashuWallet && (
                        <MintSelector wallet={activeWallet as NDKCashuWallet} />
                    )}
                </>
            )}
        </KeyboardAvoidingView>
    );
}

function MintSelector({ wallet }: { wallet: NDKCashuWallet }) {
    const [selectedMint, setSelectedMint] = useAtom(selectedMintAtom);

    useEffect(() => {
        if (wallet.mints.length > 0) {
            setSelectedMint(wallet.mints[0]);
        }
    }, [wallet?.walletId]);

    return (
        <Picker
            selectedValue={selectedMint}
            onValueChange={(itemValue) => setSelectedMint(itemValue)}
            style={styles.picker}
        >
            {wallet.mints.map((mint, index) => (
                <Picker.Item key={index} label={mint} value={mint} />
            ))}
        </Picker>
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
    amount: {
        fontSize: 72,
        marginTop: 10,
        width: '100%',
        textAlign: 'center',
        fontWeight: '900',
        backgroundColor: 'transparent',
    },
    mint: {
        fontSize: 18,
        textAlign: 'center',
        marginVertical: 8,
        fontWeight: 'bold',
    },
    selectedMint: {
        fontSize: 18,
        textAlign: 'center',
        marginVertical: 8,
        fontWeight: 'bold',
    },
    mintContainer: {
        // Add styles for the container if needed
    },
    selectedMintText: {
        // Add styles for the selected text if needed
    },
    unit: {
        fontSize: 24, // Adjusted font size for smaller display
        width: '100%',
        textAlign: 'center',
        fontWeight: '400', // Optional: adjust weight if needed
        backgroundColor: 'transparent',
    },
    picker: {
        height: 50,
        width: '100%',
    },
    continueButton: {
        backgroundColor: '#007BFF', // Button background color
        padding: 20, // Padding for the button
        borderRadius: 5, // Rounded corners
        alignItems: 'center', // Center the text
        marginTop: 20, // Space above the button
        width: '60%', // Set a narrower width for the button
        alignSelf: 'center', // Center the button horizontally
    },
    continueButtonText: {
        color: '#FFFFFF', // Text color
        fontSize: 16, // Font size
        fontWeight: 'bold', // Bold text
    },
    qrCodeContainer: {
        alignItems: 'center', // Center-aligns the QR code
        justifyContent: 'center', // Center vertically
    },
});
