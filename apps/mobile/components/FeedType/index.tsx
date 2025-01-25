import { useFollows, useNDK } from "@nostr-dev-kit/ndk-mobile";
import { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Button } from "../nativewindui/Button";
import { Text } from "../nativewindui/Text";
import { List, ListItem, ListSectionHeader } from "../nativewindui/List";
import { Checkbox } from "../nativewindui/Checkbox";
import Follows from '@/components/icons/follows';
import ForYou from '@/components/icons/for-you';
import Bookmarks from '@/components/icons/bookmarks';
import { useColorScheme } from '@/lib/useColorScheme';
import { useGroups } from "@/app/communities";
import { IconView } from '@/app/(wallet)/(walletSettings)';
import { cn } from '@/lib/cn';
import { Image } from 'expo-image';
import { SegmentedControl } from "../nativewindui/SegmentedControl";
import { router } from "expo-router";
import GroupsIcon from '@/components/icons/groups';
import { FeedKind, FeedType } from "./store";
import { useMyGroups } from "@/lib/groups/store";

function kindToSelectionIndex(kind: FeedKind) {
    if (kind === 'discover') return 0;
    if (kind === 'hashtag') return 1;
    if (kind === 'group') return 2;
    return 0;
}

export default function FeedTypeList({ value, onSelect }: { value: FeedType, onSelect: (value?: FeedType) => void }) {
    const { ndk } = useNDK();
    const [relays, setRelays] = useState<string[]>([]);

    useEffect(() => {
        if (!ndk) return;
        const connectedRelays = ndk.pool.connectedRelays();
        const connectedRelaysNames = connectedRelays.map((r) => r.url);

        setRelays(connectedRelaysNames);
    }, [ndk]);

    const [selectedIndex, setSelectedIndex] = useState(kindToSelectionIndex(value.kind));

    return (
        <View style={styles.container}>
            <Text variant="title1">Feeds</Text>

            <SegmentedControl
                values={['Discover', 'Hashtags', 'Groups']}
                selectedIndex={selectedIndex}
                onIndexChange={(index) => {
                    setSelectedIndex(index);
                }}
            />

            {selectedIndex === 0 && <Feeds value={value} onSelect={onSelect} />}
            {selectedIndex === 1 && <Hashtags value={value} onSelect={onSelect} />}
            {selectedIndex === 2 && <Groups value={value} onSelect={onSelect} />}
        </View>
    );
}

function Groups({ value, onSelect }: { value: FeedType, onSelect: (value?: FeedType) => void }) {
    const groups = useMyGroups();

    const data = useMemo(() => {
        const v = [];
        
        groups.forEach((group) => {
            console.log('group', group);
            v.push({
                leftView: <Image source={{ uri: group.picture }} style={{ width: 32, height: 32, borderRadius: 100, marginHorizontal: 10 }} />,
                title: group.name,
                subTitle: group.about,
                value: group.groupId,
                relayUrls: group.relayUrls,
            });
        });

        v.push('')

        v.push({
            title: 'Create a new group',
            subTitle: 'Public or private group for you and your friends',
            value: 'groups',
            onPress: () => {
                router.push('/groups/new');
                onSelect();
            }
        });

        v.push({
            title: 'Explore groups',
            subTitle: 'Browse groups to join',
            value: 'groups',
            onPress: () => {
                router.push('/communities');
                onSelect();
            }
        });

        return v;
    }, [groups.size]);

    const { colors } = useColorScheme();

    if (groups.size === 0) {
        return (
            <View className="flex-1 flex-col gap-6 items-center p-10">
                <GroupsIcon stroke={colors.foreground} strokeWidth={2} size={128} />
                <Text variant="title1">Groups</Text>

                <Text variant="title3" className="text-muted-foreground">
                    Private or public groups for you and your friends.
                </Text>

                <Button variant="primary" className="w-full">
                    <Text variant="body">Create a new group</Text>
                </Button>

                <Button variant="secondary" className="w-full" onPress={() => {
                    router.push('/communities');
                    onSelect();
                }}>
                    <Text>Explore groups</Text>
                </Button>
            </View>
        )
    } else {
        return (
            <List
                variant="full-width"
                data={data}
                estimatedItemSize={50}
                sectionHeaderAsGap={true}
                renderItem={({ item, target, index }) => (
                    typeof item === 'string' ? (
                        <ListSectionHeader item={item} index={index} target={target} className="bg-card" />
                    ) : (
                        <ListItem
                            className={cn(
                                'ios:pl-0 pl-2',
                                index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t',
                                item.className ?? ""
                            )}
                            titleClassName={cn('text-lg', item.value === value && '!font-extrabold')}
                            item={item}
                            index={index}
                            target={target}
                            subTitleNumberOfLines={1}
                            leftView={
                                item.icon ? (
                                    <Image source={item.icon} style={{ width: 48, height: 48, borderRadius: 18, marginRight: 10 }} />
                                ) : item.leftView ? item.leftView : null
                            }
                            onPress={() => {
                                if (item.onPress) item.onPress();
                                else onSelect({ kind: 'group', value: item.value, relayUrls: item.relayUrls })
                            }}
                        />
                    ))}
            />
        )
    }
}

function Hashtags({ value, onSelect }: { value: FeedType, onSelect: (value?: FeedType) => void }) {
    const data = useMemo(() => {
        const v = [
            { title: '#olas365', subTitle: '#olas365 challenge posts', value: '#olas365' },
            { title: '#photography', subTitle: 'Photography posts', value: '#photography' },
            { title: '#food', subTitle: 'Food posts', value: '#food' },
            { title: '#family', subTitle: 'Family posts', value: '#family' },
            { title: '#art', subTitle: 'Art posts', value: '#art' },
            { title: '#music', subTitle: 'Music posts', value: '#music' },
            { title: '#nature', subTitle: 'Nature posts', value: '#nature' },
            { title: '#travel', subTitle: 'Travel posts', value: '#travel' },
            { title: '#memes', subTitle: 'Memes posts', value: '#memes' },
        ];

        return v;
    }, []);
    
    return (<List
        variant="full-width"
        data={data}
        estimatedItemSize={50}
        sectionHeaderAsGap={false}
        renderItem={({ item, target, index }) => (
            <ListItem
                className={cn(
                    'ios:pl-0 pl-2',
                    index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                )}
                titleClassName={cn('text-lg', item.value === value.value && '!font-extrabold')}
                item={item}
                index={index}
                target={target}
                subTitleNumberOfLines={1}
                leftView={
                    item.icon ? (
                        <Image source={item.icon} style={{ width: 48, height: 48, borderRadius: 18, marginRight: 10 }} />
                    ) : item.leftView ? item.leftView : null
                }
                onPress={() => {
                    if (item.onPress) item.onPress();
                    else onSelect({ kind: 'hashtag', value: item.value })
                }}
            />
        )}
    />)
}

function Feeds({ value, onSelect }: { value: FeedType, onSelect: (value?: FeedType) => void }) {
    const { colors } = useColorScheme();

    const data = useMemo(() => {
        const v = [
            {
                title: 'Follows', subTitle: 'Posts from people you follow', onPress: () => onSelect({ kind: 'discover', value: 'follows' }),
                leftView: <IconView className="bg-yellow-500" size={35}>
                    <Follows stroke={colors.foreground} size={24} />
                </IconView>,
                value: 'follows'
            },
            {
                title: 'For You', subTitle: 'Posts from people your network', onPress: () => onSelect({ kind: 'discover', value: 'for-you' }),
                leftView: <IconView className="bg-blue-500" size={35}>
                    <ForYou stroke={colors.foreground} size={24} />
                </IconView>,
                value: 'for-you'
            },
            {
                title: 'Your Saved Posts', subTitle: 'Posts you have bookmarked', onPress: () => onSelect({ kind: 'discover', value: 'bookmarks' }),
                leftView: <IconView name="bookmark" className="bg-orange-500" size={35} />,
                value: 'bookmarks'
            },
            {
                title: 'Bookmark Feed', subTitle: 'Posts your network has bookmarked', onPress: () => onSelect({ kind: 'discover', value: 'bookmark-feed' }),
                leftView: <IconView name="bookmark" className="bg-orange-500" size={35} />,
                value: 'bookmark-feed'
            }
        ];
        return v;
    }, []);
    
    return (<List
        variant="full-width"
        data={data}
        estimatedItemSize={50}
        sectionHeaderAsGap={false}
        renderItem={({ item, target, index }) => (
            <ListItem
                className={cn(
                    'ios:pl-0 pl-2',
                    index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                )}
                titleClassName={cn('text-lg', item.value === value.value && '!font-extrabold')}
                item={item}
                index={index}
                target={target}
                subTitleNumberOfLines={1}
                leftView={
                    item.icon ? (
                        <Image source={item.icon} style={{ width: 48, height: 48, borderRadius: 18, marginRight: 10 }} />
                    ) : item.leftView ? item.leftView : null
                }
                onPress={() => {
                    if (item.onPress) item.onPress();
                    else onSelect({ kind: 'discover', value: item.value })
                }}
            />
        )}
    />)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        gap: 10,
    },
});