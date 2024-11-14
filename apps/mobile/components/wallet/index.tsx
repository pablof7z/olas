import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { View, StyleSheet, Dimensions } from "react-native";
import Balance from "./balance";
import Buttons from "./buttons";
import Views from "./views";
import { ScrollView } from "react-native-gesture-handler";
import { Toolbar } from "../nativewindui/Toolbar";
import { Text } from "../nativewindui/Text";
import { useState } from "react";
import History from "./history";
import Mints from "./mints";
import Tokens from "./tokens";
import { SegmentedControl } from "../nativewindui/SegmentedControl";

interface WalletProps {
    wallet: NDKCashuWallet;
}

const TABS = ['History', 'Mints', 'Tokens'];

export default function Wallet({ wallet }: WalletProps) {
    const [activeTab, setActiveTab] = useState<number>(0);
    
    return (
        <>
        <ScrollView style={styles.container}>
            <View style={{ flex: 1, alignContent: 'center', justifyContent: 'center', minHeight: Dimensions.get('window').height * 0.4 }}>
                <Balance wallet={wallet} />
                <Buttons wallet={wallet} />
            </View>

            <View style={{ flexDirection: 'column' }}>
                {activeTab === 0 && <History wallet={wallet} />}
                {activeTab === 1 && <Mints wallet={wallet} />}
                {activeTab === 2 && <Tokens wallet={wallet} />}
            </View>
        </ScrollView>

        <Toolbar>
            <View style={{ flex: 1 }}>
            <SegmentedControl
                values={TABS}
                selectedIndex={activeTab}
                onIndexChange={(index) => {
                        setActiveTab(index);
                    }}
                />
            </View>
        </Toolbar>
        
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})