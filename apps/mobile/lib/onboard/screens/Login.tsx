import {
    NDKNip46Signer,
    NDKPrivateKeySigner,
    useNDK,
    useNDKCurrentUser,
    useNDKSessionLogin,
} from "@nostr-dev-kit/ndk-mobile";
import { CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useAtom, useSetAtom } from "jotai";
import { ArrowRight, QrCode } from "lucide-react-native";
import React, { useCallback, useEffect } from "react";
import { Alert, Dimensions, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from "react-native";

import { LoginWithNip55Button } from "../components/LoginWithNip55Button";
import { modeAtom, payloadAtom, scanQRAtom } from "../store";

import { Button } from "@/components/nativewindui/Button";
import { Text } from "@/components/nativewindui/Text";

export function Login() {
    const [payload, setPayload] = useAtom(payloadAtom);
    const [scanQR, setScanQR] = useAtom(scanQRAtom);
    const ndkLogin = useNDKSessionLogin();
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const router = useRouter();
    const setMode = useSetAtom(modeAtom);

    const createSignerFromPayload = useCallback(
        (payload: string): NDKPrivateKeySigner | NDKNip46Signer | null => {
            const trimmedPayload = payload.trim();
            if (trimmedPayload.startsWith("nsec1")) {
                try {
                    return new NDKPrivateKeySigner(trimmedPayload);
                } catch (e) {
                    console.error("Failed to create private key signer", e);
                    Alert.alert("Invalid Key", "The provided private key (nsec) is invalid.");
                    return null;
                }
            } else if (trimmedPayload.startsWith("bunker://")) {
                if (!ndk) {
                    Alert.alert("Error", "NDK not initialized for bunker login");
                    return null;
                }
                try {
                    // NDKNip46Signer constructor might need ndk instance
                    return new NDKNip46Signer(ndk, trimmedPayload);
                } catch (e) {
                    console.error("Failed to create bunker signer", e);
                    Alert.alert("Invalid Bunker URL", "The provided bunker URL is invalid.");
                    return null;
                }
            }
            Alert.alert("Invalid Input", "Please enter a valid nsec private key or bunker:// URL.");
            return null;
        },
        [ndk],
    ); // Include ndk dependency if NDKNip46Signer needs it

    const handleLogin = useCallback(async () => {
        if (!payload) {
            Alert.alert("Error", "Please enter your private key or scan a QR code");
            return;
        }

        const signer = createSignerFromPayload(payload);

        if (signer) {
            try {
                await ndkLogin(signer);
                // Login successful, navigation is handled by useEffect watching currentUser
            } catch (error: any) {
                console.error("Error adding signer:", error);
                Alert.alert("Login Error", error?.message || "An error occurred during login");
            }
        }
    }, [payload, createSignerFromPayload]);

    useEffect(() => {
        if (currentUser) {
            router.replace("/");
        }
    }, [currentUser, router]);

    async function handleBarcodeScanned({ data }: { data: string }) {
        setPayload(data.trim());
        setScanQR(false);
        const signer = createSignerFromPayload(data.trim());
        if (signer) {
            try {
                await ndkLogin(signer);
                // Login successful, navigation is handled by useEffect watching currentUser
            } catch (error: any) {
                console.error("Error adding signer from QR:", error);
                Alert.alert("Login Error", error?.message || "An error occurred during login");
            }
        }
    }

    const switchToSignup = useCallback(() => {
        setMode("signup");
    }, [setMode]);

    return (
        <View className="h-full w-full flex-1 items-stretch justify-center gap-4">
            {scanQR && (
                <View
                    style={{
                        borderRadius: 8,
                        height: Dimensions.get("window").width * 0.75,
                        width: Dimensions.get("window").width * 0.75,
                    }}
                >
                    <CameraView
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"],
                        }}
                        style={{ flex: 1, width: "100%", borderRadius: 8 }}
                        onBarcodeScanned={handleBarcodeScanned}
                    />
                </View>
            )}

            <TextInput
                style={styles.input}
                className="text-foreground placeholder:text-muted-foreground"
                multiline
                autoCapitalize="none"
                autoComplete={undefined}
                placeholder="Enter your nsec or bunker:// connection"
                autoCorrect={false}
                value={payload}
                onChangeText={setPayload}
            />

            <Button variant="accent" size={Platform.select({ ios: "lg", default: "md" })} onPress={handleLogin}>
                <Text className="py-2 text-lg font-bold text-white">Login</Text>
                <ArrowRight size={24} color="white" />
            </Button>

            <LoginWithNip55Button />

            <Button variant="plain" onPress={switchToSignup}>
                <Text>New to nostr?</Text>
            </Button>

            {!scanQR && (
                <View className="w-full flex-row justify-center">
                    <Button
                        variant="plain"
                        onPress={() => {
                            if (ndk) ndk.signer = undefined;
                            setScanQR(true);
                        }}
                        className="bg-muted/10 border border-border"
                        style={{ flexDirection: "column", gap: 8 }}
                    >
                        <QrCode size={64} />
                        <Text>Scan QR</Text>
                    </Button>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        width: "100%",
        height: 100,
        borderColor: "gray",
        fontFamily: "monospace",
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
    },
});
