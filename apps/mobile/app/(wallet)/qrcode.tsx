import { useState } from 'react';
import { ClipboardPasteButton } from 'expo-clipboard'; // Add this import
import { StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { CameraView } from 'expo-camera';
import { walleteStore } from '../stores';
import { useStore } from 'zustand';
import { Text } from '@/components/nativewindui/Text';

function QrcodeView() {
    const [view, setView] = useState<'ecash' | 'ln'>('ecash');
    const { activeWallet } = useStore(walleteStore);
    const [error, setError] = useState<string|null>(null);

    if (!activeWallet) return;

    const onReceived = () => {
        router.back();
    }

    const handleQRCodeScanned = (data: string) => {
        if (data.startsWith("cashu")) {
            activeWallet.receiveToken(data)
            .then((result) => {
                console.trace(result);
                onReceived();
            })
            .catch((error) => {
                setError(error.message);
            });
        }
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>

            {error && (
                <View className="mb-2 bg-red-500 p-2 px-4 rounded-lg">
                    <Text className="text-white text-center">{error}</Text>
                </View>
            )}
            
            <CameraView 
                 barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={{ flex: 1, maxHeight: '50%', borderRadius: 20 }} 
                onBarcodeScanned={({ data }) => handleQRCodeScanned(data)} // Add QR code scan handler
            >
            </CameraView>
            {Clipboard.isPasteButtonAvailable && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ClipboardPasteButton 
                      style={{
                        width: '100%',
                        height: 50,
                      }}
                      className="ios:active:opacity-80 bg-primary"
                      onPress={(a) => {
                          if (a.text) handleQRCodeScanned(a.text)
                      }}
                      displayMode="iconAndLabel" 
                  />
                </View>
            )}
        </View>
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

export default QrcodeView;
