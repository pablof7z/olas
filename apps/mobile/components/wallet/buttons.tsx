import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useColorScheme } from '~/lib/useColorScheme';
import { Text } from "@/components/nativewindui/Text";
import { router } from "expo-router";
import { Icon } from "@roninoss/icons";

interface ButtonsProps {
    wallet: NDKCashuWallet;
}

export default function Buttons({ wallet }: ButtonsProps) {
    const handleSend = () => router.push({
        pathname: '/(wallet)/send'
    });

    const handleReceive = () => router.push({
        pathname: '/(wallet)/receive'
    });

    const handleQrcode = () => router.push({
        pathname: '/(wallet)/qrcode'
    });

    const { colors } = useColorScheme();
    
    return (
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.foreground }]} onPress={handleSend}>
                <Text style={[styles.buttonText, { color: colors.background }]}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{
            }} onPress={handleQrcode}>
                <Icon name="qrcode" size={32} color={colors.foreground} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.foreground }]} onPress={handleReceive}>
                <Text style={[styles.buttonText, { color: colors.background }]}>Receive</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 16,
        gap: 20,
    },
    button: {
        flex: 1,
        padding: 10,
        paddingVertical: 15,
        borderRadius: 5,
        marginBottom: 10,
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
    },
});