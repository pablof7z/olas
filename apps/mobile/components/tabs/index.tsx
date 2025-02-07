import { cn } from "@/lib/cn";
import { PrimitiveAtom, useAtom } from "jotai";
import { View, Pressable } from "react-native";
import { Text } from "../nativewindui/Text";
export default function Tabs({ options, atom }: { options: string[], atom: PrimitiveAtom<string> }) {
    const [selectedTab, setSelectedTab] = useAtom(atom);

    return (
        <View className="flex-row items-center gap-2 w-full">
            {options.map((option, index) => (
                <Pressable key={index} onPress={() => setSelectedTab(option)}>
                    <Text variant="title1" className={cn(selectedTab === option ? 'font-extrabold text-xl' : 'text-lg text-muted-foreground')}>{option}</Text>
                </Pressable>
            ))}
        </View>
    )
}
