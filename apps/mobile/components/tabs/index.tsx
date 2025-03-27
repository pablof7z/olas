import { PrimitiveAtom, useAtom } from 'jotai';
import { View, Pressable } from 'react-native';

import { Text } from '../nativewindui/Text';

import { cn } from '@/lib/cn';
export default function Tabs({ options, atom }: { options: string[]; atom: PrimitiveAtom<string> }) {
    const [selectedTab, setSelectedTab] = useAtom(atom);

    return (
        <View className="w-full flex-row items-center gap-2">
            {options.map((option, index) => (
                <Pressable key={index} onPress={() => setSelectedTab(option)}>
                    <Text
                        variant="title1"
                        className={cn(selectedTab === option ? 'text-xl font-extrabold' : 'text-lg text-muted-foreground')}>
                        {option}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}
