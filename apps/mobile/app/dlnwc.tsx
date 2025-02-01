import { useGlobalSearchParams, usePathname } from "expo-router";
import { Text } from "@/components/nativewindui/Text";
import { View } from "react-native";
import { useEffect } from "react";

export default function NWCDeepLinkScreen() {
    const pathname = usePathname();
    const result = useGlobalSearchParams();
    const value = result?.value;

    useEffect(() => {
        
    }, [result])
    
    return (
        <View className="flex-1 items-center justify-center">
            <Text variant="title1">NWC</Text>
            <Text className="text-red-500">{value}</Text>
            <Text>{JSON.stringify(result)}</Text>
            <Text>{pathname}</Text>
        </View>
    )
}