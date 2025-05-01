import {
    useNDKCurrentUser
} from "@nostr-dev-kit/ndk-mobile";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { payloadAtom } from "../store";

export function Login() {
    const [payload, setPayload] = useAtom(payloadAtom);
    const currentUser = useNDKCurrentUser();
    const router = useRouter();

    useEffect(() => {
        if (currentUser) {
            router.replace("/");
        }
    }, [currentUser, router]);

    return (
        <View>
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

            
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        width: "100%",
        height: 100,
        borderColor: "gray",
        fontFamily: "monospace",
        borderRadius: 5,
        backgroundColor: '#ffffffdd',
        padding: 10,
        marginBottom: 20,
    },
});
