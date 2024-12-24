import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { DropdownMenu } from './nativewindui/DropdownMenu';
import { Text } from './nativewindui/Text';
import { Filter } from 'lucide-react-native';
import { Pressable, Button } from 'react-native';
import { createDropdownItem } from './nativewindui/DropdownMenu/utils';
import { useColorScheme } from '@/lib/useColorScheme';


const FilterButton = ({ includeTweets, setIncludeTweets }: { includeTweets: boolean; setIncludeTweets: (value: boolean) => void }) => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const { colors } = useColorScheme();
    const [count, setCount] = useState(0);
    const int = useRef<NodeJS.Timeout | null>(null);
    const currentCount = useRef(0);

    if (!int.current) {
        console.log('setting interval');
        int.current = setInterval(() => {
            setCount(++currentCount.current);
        }, 500);
    } else {
        console.log('interval already set');
    }
    
    const press = async () => {
        console.log('pressing');
        await sleep(5000);
        setCount(0);
        console.log('count', count);
    }

    return (
        <Button title={count.toString()} onPress={press} />
    )

    return (
        <DropdownMenu
            items={[
                createDropdownItem({
                    actionKey: 'high-quality',
                    title: 'High-quality content',
                    subTitle: 'High quality posts at a lower velocity',
                    state: { checked: !includeTweets },
                }),
                createDropdownItem({
                    actionKey: 'generic',
                    title: 'Generic content',
                    subTitle: 'Include lower-quality generic content',
                    state: { checked: includeTweets },
                }),
            ]}
            onItemPress={(item) => {
                if (item.actionKey === 'high-quality') setIncludeTweets(false);
                if (item.actionKey === 'generic') setIncludeTweets(true);
            }}>
            <Pressable>
                <Filter size={24} color={colors.foreground} />
            </Pressable>
        </DropdownMenu>
    );
}

export default FilterButton;