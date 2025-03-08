import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-mobile";
import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "../nativewindui/Button";
import { Text } from "../nativewindui/Text";
import { List, ListItem, ListSectionHeader } from "../nativewindui/List";
import Follows from '@/components/icons/follows';
import ForYou from '@/components/icons/for-you';
import { useColorScheme } from '@/lib/useColorScheme';
import { IconView } from '@/components/icon-view';
import { cn } from '@/lib/cn';
import { Image } from 'expo-image';
import { router } from "expo-router";
import GroupsIcon from '@/components/icons/groups';
import { FeedType } from "./store";
import { useMyGroups } from "@/lib/groups/store";
import { useAppSettingsStore } from "@/stores/app";
import { X } from "lucide-react-native";
import { useAtomValue } from "jotai";
import { atom } from "jotai";
import { COMMUNITIES_ENABLED } from "@/utils/const";
import Tabs from "@/components/tabs";

const tabAtom = atom<string>('Feeds');

export default function FeedTypeList({ value, onSelect }: { value: FeedType, onSelect: (value?: FeedType) => void }) {
    const selectedTab = useAtomValue(tabAtom);

    const options = ['Feeds'];

    if (COMMUNITIES_ENABLED) {
        options.push('Groups');
    }

    // options.push('Relays')

    return (
        <View style={styles.container}>
            <View className="flex-row items-center justify-between w-full gap-6">
                <View className="flex-1 px-4">
                    <Tabs options={options} atom={tabAtom} />
                </View>
            </View>

            {selectedTab === 'Feeds' && <Feeds value={value} onSelect={onSelect} />}
            {selectedTab === 'Groups' && <Groups value={value} onSelect={onSelect} />}
            {/* {selectedIndex === 0 && <Feeds value={value} onSelect={onSelect} />} */}
            {/* {selectedIndex === 1 && <Hashtags value={value} onSelect={onSelect} />} */}
            {/* {selectedIndex === 1 && <Groups value={value} onSelect={onSelect} />} */}
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

// function Hashtags({ value, onSelect }: { value: FeedType, onSelect: (value?: FeedType) => void }) {
//     const data = useMemo(() => {
//         const v = [
            
//         ];

//         return v;
//     }, []);
    
//     return (<List
//         variant="full-width"
//         data={data}
//         estimatedItemSize={50}
//         sectionHeaderAsGap={false}
//         renderItem={({ item, target, index }) => (
//             <ListItem
//                 className={cn(
//                     'ios:pl-0 pl-2',
//                     index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
//                 )}
//                 titleClassName={cn('text-lg', item.value === value.value && '!font-extrabold')}
//                 item={item}
//                 index={index}
//                 target={target}
//                 subTitleNumberOfLines={1}
//                 leftView={
//                     item.icon ? (
//                         <Image source={item.icon} style={{ width: 48, height: 48, borderRadius: 18, marginRight: 10 }} />
//                     ) : item.leftView ? item.leftView : null
//                 }
//                 onPress={() => {
//                     if (item.onPress) item.onPress();
//                     else onSelect({ kind: 'hashtag', value: item.value })
//                 }}
//             />
//         )}
//     />)
// }

function Feeds({ value, onSelect }: { value: FeedType, onSelect: (value?: FeedType) => void }) {
    const { colors } = useColorScheme();
    const currentUser = useNDKCurrentUser();
    const savedSearches = useAppSettingsStore(s => s.savedSearches);

    const data = useMemo(() => {
        const v = [];
        
        if (currentUser) {
            v.push({
                title: 'Follows', subTitle: 'Posts from people you follow', onPress: () => onSelect({ kind: 'discover', value: 'follows' }),
                leftView: <IconView className="bg-purple-500" size={35}>
                    <Follows stroke={"white"} size={24} />
                </IconView>,
                value: 'follows'
            })

            v.push({
                title: 'For You', subTitle: 'Posts from people in your network', onPress: () => onSelect({ kind: 'discover', value: 'for-you' }),
                leftView: <IconView className="bg-blue-500" size={35}>
                    <ForYou stroke={"white"} size={24} />
                </IconView>,
                value: 'for-you'
            })

            v.push({
                title: 'Bookmarks', subTitle: 'Posts you have bookmarked',
                leftView: <IconView name="bookmark" className="bg-red-500" size={35} />,
                value: 'bookmarks',
                onPress: () => {
                    router.push('/bookmarks');
                    onSelect();
                }
            })
        } else {
            v.push({
                title: 'Home', subTitle: 'Random posts', onPress: () => onSelect({ kind: 'discover', value: 'for-you' }),
                leftView: <IconView className="bg-blue-500" size={35}>
                    <ForYou stroke={"white"} size={24} />
                </IconView>,
                value: 'for-you'
            })  
        }

        v.push(...savedSearches
            .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
            .map(s => ({
            title: s.title,
            subTitle: s.subtitle,
                value: s.title,
                type: 'search',
            onPress: () => onSelect({ kind: 'search', value: s.title, hashtags: s.hashtags })
        })));

        return v;
    }, [currentUser?.pubkey, savedSearches.length]);

    const removeSavedSearch = useAppSettingsStore(s => s.removeSavedSearch);

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
                rightView={
                    item.type === 'search' ? (
                        <Button variant="plain" size="sm" onPress={() => removeSavedSearch(item.title)}>
                            <X size={24} color={colors.muted} />
                        </Button>
                    ) : null
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