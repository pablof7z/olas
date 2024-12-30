import { LargeTitleHeader } from "@/components/nativewindui/LargeTitleHeader";
import { useMuteList, useUserProfile } from "@nostr-dev-kit/ndk-mobile";
import { FlatList, View } from "react-native";
import { Text } from "@/components/nativewindui/Text";
import { List, ListItem } from "@/components/nativewindui/List";
import * as User from "@/components/ui/user";
import { RenderTarget } from "@shopify/flash-list";

export default function MutedScreen() {
    const muteList = useMuteList();
    
    return (
        <View style={{ flex: 1 }}>
            <List
                variant="insets"
                data={Array.from(muteList.values())}
                estimatedItemSize={50}
                renderItem={({ item, index, target }) => <MutedUser pubkey={item} target={target} index={index} />}
            />
        </View>
    )
}


function MutedUser({ pubkey, target, index }: { pubkey: string, target: RenderTarget, index: number }) {
    const {userProfile} = useUserProfile(pubkey);
    
    return (
        <ListItem
            index={index}
            target={target}
            item={{
                title: <User.Name userProfile={userProfile} pubkey={pubkey} />,
                subtitle: <Text className="text-muted-foreground">{pubkey}</Text>,
            }}
            leftView={<User.Avatar userProfile={userProfile} size={24} style={{ width: 28, height: 28, marginRight: 10 }} />}
        />
    )
}