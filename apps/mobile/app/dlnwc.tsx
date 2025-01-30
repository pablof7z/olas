import { useGlobalSearchParams, useLocalSearchParams, usePathname } from "expo-router";
import { Text } from "@/components/nativewindui/Text";
import { View } from "react-native";

export default function NWCDeepLinkScreen() {
    const pathname = usePathname();
    const {test} = useGlobalSearchParams();
    return (
        <View className="flex-1 items-center justify-center">
            <Text variant="title1">NWC</Text>
            <Text>{JSON.stringify(test)}</Text>
            <Text>{pathname}</Text>
        </View>
    )
}