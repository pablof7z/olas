// Welcome.tsx
import React from "react";
import {
    View,
    StyleSheet, Text,
    Image, Platform
} from "react-native";

export function Welcome() {
    return (
        <View style={styles.inner}>
                <Image
                    source={require("../../../assets/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Welcome to Olas</Text>
                <Text style={styles.subtitle}>
                    Make waves
                </Text>
        </View>
    );
}

const SP = 16;

const styles = StyleSheet.create({
    inner: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 0,
    },
    logo: {
        width: 256,
        height: 256,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#fff",
        marginBottom: SP * 0.5,
        fontFamily: Platform.select({
            ios:   "Inter-Bold",
            android: "Inter-Bold",
            default:   "System",
        }),
    },
    subtitle: {
        fontSize: 14,
        color: "#fff",
        textAlign: "center",
        marginBottom: SP * 2,
        lineHeight: 20,
    },
});
