import { Picker } from '@react-native-picker/picker';
import { Text } from '@/components/nativewindui/Text';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import QRCode from 'react-native-qrcode-svg';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import { TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import WalletBalance from '@/components/ui/wallet/WalletBalance';
import { toast } from '@backpackapp-io/react-native-toast';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

export default function ReceiveLn({ onReceived }: { onReceived: () => void }) {
    const { activeWallet, balance } = useNDKWallet();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [selectedMint, setSelectedMint] = useState<string | null>(null);
    const inputRef = useRef<TextInput | null>(null);
    const [amount, setAmount] = useState(1000);

    useEffect(() => {
        if (activeWallet && (activeWallet as NDKCashuWallet).mints.length > 0) {
            setSelectedMint((activeWallet as NDKCashuWallet).mints[0]);
        }
    }, [activeWallet]);

    if (!(activeWallet as NDKCashuWallet))
        return (
            <View>
                <Text>No wallet found</Text>
            </View>
        );

    const handleContinue = async () => {
        if (!selectedMint) {
            console.error('No mint selected');
            return;
        }

        // hide keyboard
        Keyboard.dismiss();
        
        const deposit = (activeWallet as NDKCashuWallet).deposit(amount, selectedMint);

        deposit.on('success', (token) => {
            console.log('success', token);
            onReceived();
        });

        try {
            const qr = await deposit.start();
            console.log('qr', qr);
            setQrCode(qr);
        } catch (e) {
            toast.error(e.message);
        }
    };

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

            <WalletBalance amount={amount} unit={(activeWallet as NDKCashuWallet).unit} onPress={() => inputRef.current?.focus()} />

            {qrCode ? ( // Conditionally render QR code
                <View>
                    <Text>Your QR Code:</Text>
                    <View style={styles.qrCodeContainer}>
                        <QRCode value={qrCode} size={350} />
                    </View>
                </View>
            ) : (
                <>
                    <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
                        <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>

                    <Picker selectedValue={selectedMint} onValueChange={(itemValue) => setSelectedMint(itemValue)} style={styles.picker}>
                        {(activeWallet as NDKCashuWallet).mints.map((mint, index) => (
                            <Picker.Item key={index} label={mint} value={mint} />
                        ))}
                    </Picker>
                </>
            )}
        </KeyboardAvoidingView>
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
