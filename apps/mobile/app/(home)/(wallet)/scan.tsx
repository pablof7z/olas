import { Text } from "@/components/nativewindui/Text";
import { decode as decodeBolt11 } from "light-bolt11-decoder";
import * as Clipboard from 'expo-clipboard';
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button, ButtonState } from "@/components/nativewindui/Button";
import { View, StyleSheet } from 'react-native';
import { getBolt11ExpiresAt, NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { ClipboardPasteButton } from "expo-clipboard";
import { useState } from "react";
import { formatMoney } from "@/utils/bitcoin";
import WalletBalance from "@/components/ui/wallet/WalletBalance";
import { toast } from "@backpackapp-io/react-native-toast";
import { useNDKWallet } from "@nostr-dev-kit/ndk-mobile";

export default function Scan() {
    const [permission, requestPermission] = useCameraPermissions();
    const { activeWallet } = useNDKWallet();
    const [amount, setAmount] = useState<number | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [state, setState] = useState<ButtonState>('idle');
    const [payload, setPayload] = useState<string | null>(null);

    if (!permission) {
        return <View />; // Loading state
    }
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    function identifyPayload(payload: string) {
        if (payload.startsWith('cashu:')) {
            return 'cashu';
        } else if (payload.startsWith('lightning:')) {
            return 'lightning';
        }

        return 'lightning';
    }

    async function receive(payload: string) {
        const payloadType = identifyPayload(payload);

        setPayload(payload);

        if (payloadType === 'lightning') {
            if (payload.startsWith('lightning:')) {
                payload = payload.replace('lightning:', '');
            }
            
            const decoded = decodeBolt11(payload);
            let amount = Number(decoded.sections.find(section => section.name === 'amount')?.value);
            let description = decoded.sections.find(section => section.name === 'description')?.value;
            setAmount(amount);
            setDescription(description);
            return;
        }
        
        if (!(activeWallet instanceof NDKCashuWallet)) {
            return;
        }

        (activeWallet as NDKCashuWallet).receiveToken(payload)
            .then((result) => {
                console.trace(result);
            })
            .catch((error) => {
                console.trace(error);
                toast.error(`Error receiving token: ${error.message}`);
            });
    }

    const handleQRCodeScanned = (data: string) => {
        console.log('QR code scanned', data);
        receive(data); // Call send function with scanned data
    };

    const pay = async () => {
        console.log('pay', payload);
        if (!payload) return;

        setState('loading');
        activeWallet.lnPay({ pr: payload })
            .then((result) => {
                setState('success');
            })
            .catch((error) => {
                setState('error');
                toast.error(`Error paying invoice: ${error.message}`);
            });
    }

    if (amount) {
        return (
            <View className="flex-1 items-center justify-center p-4">
                <Text className="text-3xl font-bold">Pay</Text>
                <WalletBalance amount={amount / 1000} unit="sats" onPress={() => {}} />
                <Text>{description ?? "No description"}</Text>

                <Button className="w-full !py-4" variant="primary" size="lg" onPress={pay} state={state}>
                    <Text className="text-xl font-bold">Pay {formatMoney({ amount, unit: 'msats' })}</Text>
                </Button>

                <Button className="w-full !py-4" variant="plain" size="lg" onPress={() => {
                    setAmount(null);
                    setDescription(null);
                }}>
                    <Text className="text-muted-foreground">Cancel</Text>
                </Button>
            </View>
        )
    }
    
    return (
        <View style={styles.container}>
            <CameraView 
                 barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                style={styles.camera} 
                onBarcodeScanned={({ data }) => handleQRCodeScanned(data)} // Add QR code scan handler
            >
                <View style={styles.buttonContainer} />
            </CameraView>
            {Clipboard.isPasteButtonAvailable && (
                <View style={styles.buttonContainer}>
                  <ClipboardPasteButton 
                      style={[styles.buttonPaste, { width: '100%', height: 50 }]} 
                      onPress={(a) => {
                          if (a.text) receive(a.text)
                      }}
                      displayMode="iconAndLabel" 
                  />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
        padding: 20,
    },
    message: {
      textAlign: 'center',
      paddingBottom: 10,
    },
    camera: {
      flex: 1,
      maxHeight: '50%',
      borderRadius: 30,
    },
    buttonContainer: {
      flexDirection: 'row',
      backgroundColor: 'transparent',
      margin: 20,
    },
    button: {
      flex: 1,
      alignSelf: 'flex-end',
      alignItems: 'center',
    },
    text: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
    },
    buttonPaste: {
        alignItems: 'center',
        margin: 10,
    },
  });
