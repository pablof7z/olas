import { Hexpubkey, NDKCashuMintList, NDKKind } from "@nostr-dev-kit/ndk"
import { useMemo, useState } from "react"
import { useSubscribe } from "@/ndk-expo";
import { Text } from '@/components/nativewindui/Text';
import { View } from "react-native";
import { ListItem } from "@/components/nativewindui/List";
import { List } from "@/components/nativewindui/List";
import * as User from '@/ndk-expo/components/user';
import { Button } from "@/components/nativewindui/Button";

export default function SendZap() {
    const [selectedUser, setSelectedUser] = useState<Hexpubkey | undefined>(undefined);
    const filters = useMemo(() => ([
        { kinds: [NDKKind.CashuMintList], limit: 10 }
    ]), []);
    const opts = useMemo(() => ({ closeOnEose: true, klass: NDKCashuMintList }), []);

    const { events} = useSubscribe({filters, opts });

    if (selectedUser) {
        return (
            <View style={{ flex: 1 }}>
                <View className="flex-col items-center my-4">
                    <User.Profile pubkey={selectedUser}>
                        <User.Avatar style={{ width: 100, height: 100 }} />
                        <Text className="text-lg font-bold">
                            <User.Name />
                        </Text>
                    </User.Profile>

                    <Button>
                        <Text>Send</Text>
                    </Button>
                </View>
            </View>
        )
    }

    return (
        <View style={{ flex: 1 }}>
            <Text>{events.length}</Text>
            <List
                data={events}
                keyExtractor={(item) => item.pubkey}
                estimatedItemSize={50}
                renderItem={({ item, index, target }) => (
                    <ListItem
                        onPress={() => setSelectedUser(item.pubkey)}
                        index={index}
                        target={target}
                        item={{
                            title: item.pubkey,
                            subTitle: item.content
                        }}
                    >
                        <Text>{item.content}</Text>
                    </ListItem>
                )}
            />
        </View>
    )
}