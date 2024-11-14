import "react-native-get-random-values";
import React from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'; // Update imports
import { TouchableOpacity } from 'react-native-gesture-handler';
import * as Clipboard from 'expo-clipboard';
import { ClipboardPasteButton } from 'expo-clipboard'; // Add this import
import { useState } from 'react'; // Add useState import
import { Text } from '@/components/nativewindui/Text';
import { useNDKWallet } from '@/ndk-expo/providers/wallet';
import { Stack } from 'expo-router';
import Drawer from 'expo-router/drawer';

const SendLn = () => {
    const [permission, requestPermission] = useCameraPermissions(); // Use camera permissions
    const { defaultWallet } = useNDKWallet();

    if (!permission) {
        return <View><Text>Loading...</Text></View>
    }
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    async function send(paymentRequest: string) {
        if (!defaultWallet) {
            return;
        }

        defaultWallet.lnPay({pr: paymentRequest})
            .then((result) => {
                console.log(result);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    const handleQRCodeScanned = (data: string) => {
        console.log('QR code scanned', data);
        send(data); // Call send function with scanned data
    };

    return (
        <View style={styles.container}>
            <Drawer.Screen options={{ title: 'Send' }} />
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
                          if (a.text) send(a.text)
                      }}
                      displayMode="iconAndLabel" 
                  />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
    },
    message: {
      textAlign: 'center',
      paddingBottom: 10,
    },
    camera: {
      flex: 1,
      maxHeight: '50%',
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

export default SendLn;
