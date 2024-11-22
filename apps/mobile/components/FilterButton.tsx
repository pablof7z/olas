import { memo } from "react";
import { DropdownMenu } from "./nativewindui/DropdownMenu";
import { Filter } from "lucide-react-native";
import { Pressable } from "react-native";
import { createDropdownItem } from "./nativewindui/DropdownMenu/utils";
import { useColorScheme } from "@/lib/useColorScheme";

const FilterButton = memo(({ includeTweets, setIncludeTweets }: { includeTweets: boolean; setIncludeTweets: (value: boolean) => void }) => {
    const { colors } = useColorScheme();

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
});

export default memo(FilterButton);