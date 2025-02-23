import { NDKEvent } from "@nostr-dev-kit/ndk-mobile";
import { View } from "react-native";
import { Text } from "../nativewindui/Text";
import { ShoppingCart, Tag } from "lucide-react-native";
import { formatMoney } from "@/utils/bitcoin";

export default function ProductGridContainer({ event, children }: { event: NDKEvent, children: React.ReactNode }) {
    const price = event.getMatchingTags("price")[0];

    if (!price) return null;
    
    return (
        <View style={{ position: 'relative' }}>
            {children}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                <View style={{ margin: 4, backgroundColor: 'white', padding: 4, paddingHorizontal: 8, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ShoppingCart size={16} fill="white" color="black" />
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'black' }}>{formatMoney({ amount: Number(price[1]), unit: price[2] })}</Text>
                </View>
            </View>
        </View>
    )
}