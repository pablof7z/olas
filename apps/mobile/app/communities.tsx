import { LargeTitleHeader } from "@/components/nativewindui/LargeTitleHeader";
import { List, ListItem } from "@/components/nativewindui/List";
import { cn } from "@/lib/cn";
import { Hexpubkey, NDKEvent, NDKKind, NDKList, NDKRelay, NDKRelaySet, NDKSimpleGroupMemberList, NDKSimpleGroupMetadata, NDKSubscriptionCacheUsage, useNDK, useNDKCurrentUser, useNDKSessionEventKind, wrapEvent } from "@nostr-dev-kit/ndk-mobile";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useImage, Image } from "expo-image";
import { Button } from "@/components/nativewindui/Button";
import { Text } from "@/components/nativewindui/Text";

export type GroupEntry = {
    groupId: string;
    relays?: NDKRelay[];
    name?: string;
    about?: string;
    picture?: string;
    members: Set<Hexpubkey>;
}

export function useGroups() {
    const { ndk } = useNDK();
        
    const groups = useRef<Map<string, GroupEntry>>(new Map());
    const [groupEntries, setGroupEntries] = useState([]);
    const eosed = useRef(false);

    const handleEvent = useCallback((event: NDKEvent) => {
        const groupId = event.dTag;
        const current: GroupEntry = groups.current.get(groupId) ?? { groupId, members: new Set(), relays: event.onRelays };

        if (event.kind === NDKSimpleGroupMetadata.kind) {
            const wrappedEvent = NDKSimpleGroupMetadata.from(event);
            current.name = wrappedEvent.name;
            current.about = wrappedEvent.about;
            current.picture = wrappedEvent.picture;
        } else if (event.kind === 39002) {
            const list = NDKSimpleGroupMemberList.from(event);
            current.members = list.memberSet;
        }

        groups.current.set(groupId, current as GroupEntry);
    }, [])

    useEffect(() => {
        const relaySet = NDKRelaySet.fromRelayUrls([
            'wss://groups.0xchat.com'
        ], ndk);
        const sub = ndk.subscribe([
            { kinds: [39000, 39002] },
        ], {
            groupable: false,
            closeOnEose: false,
            cacheUsage: NDKSubscriptionCacheUsage.ONLY_RELAY
        }, relaySet, false)
        sub.on("event", handleEvent)
        sub.on("eose", () => {
            eosed.current = true;
            setGroupEntries(Array.from(groups.current.values()))
        })
        sub.start();

        return (() => {
            sub.stop();
        })
    }, [])
    
    return groupEntries;
}

export default function CommunitiesScreen() {
    const communities = useGroups();

    return (<>
        <LargeTitleHeader
            title={"Communities"}
        />
        <List
            data={communities}
            keyExtractor={(item) => item.groupId}
            estimatedItemSize={52}
            variant="insets"
            renderItem={({ item, index, target }) => (
                <ListItem
                    item={{
                        title: item.name,
                        subTitle: item.about,
                    }}
                    leftView={(<View className="w-10 h-10 rounded-full flex-1">
                        <Image
                            source={{uri: item.picture}}
                            className="w-10 h-10 rounded-full bg-red-500 flex-1"
                        />
                    </View>)}
                    rightView={(<RightViewItem groupEntry={item} />)}
                    className={cn('ios:pl-0 pr-2', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
                    titleClassName="text-lg"
                    index={index}
                    target={target}
                >
                </ListItem>
            )}
        />
    </>);
}

function RightViewItem({ groupEntry }: { groupEntry: GroupEntry}) {
    const currentUser = useNDKCurrentUser();
    const isMember = currentUser && groupEntry.members.has(currentUser.pubkey);
    const { ndk } = useNDK();
    const groupList = useNDKSessionEventKind<NDKList>(NDKList, NDKKind.SimpleGroupList, { create: true });

    const join = useCallback(async (groupEntry: GroupEntry) => {
        const joinReq = new NDKEvent(ndk)
        joinReq.kind = NDKKind.GroupAdminRequestJoin;
        joinReq.tags.push(['h', groupEntry.groupId])
        const relaySet = new NDKRelaySet(new Set(groupEntry.relays), ndk);
        console.log('publishing to', relaySet.relayUrls)
        joinReq.publish(relaySet)

        await groupList.addItem(['group', groupEntry.groupId, ...groupEntry.relays.map(r => r.url)])
        groupList.publish();
    }, [ndk])
    
    if (isMember) return null;

    return (
        <Button variant="secondary" size="sm" onPress={() => join(groupEntry)}>
            <Text>Join</Text>
        </Button>
    )
}