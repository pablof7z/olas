import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Button, View } from 'react-native';
import { PostType, publishStore } from '../stores/publish';
import { useStore } from 'zustand';
import { Text } from '@/components/nativewindui/Text';
import { List, ListItem } from '@/components/nativewindui/List';
import { cn } from '@/lib/cn';
import { Image, Type } from 'lucide-react-native';
import { useColorScheme } from '@/lib/useColorScheme';

export default function TypeScreen() {
    const { type, setType } = useStore(publishStore);
    const { colors } = useColorScheme();

    const changeType = (type: PostType) => {
        setType(type);
        router.back();
    };

    const data = useMemo(() => {
        return [
            {
                id: 'image',
                title: 'Publish as a high-quality post',
                subTitle: 'For your evergreen content. Reach a smaller audience that is specifically looking for this type of content.',
                onPress: () => changeType('high-quality'),
                leftView: (
                    <View style={{ paddingHorizontal: 10 }}>
                        <Image size={24} color={colors.muted} />
                    </View>
                ),
                rightView: (
                    <View className="flex-1 justify-center px-4">
                        <Text className="text-xs text-muted-foreground">Kind 20</Text>
                    </View>
                ),
            },
            {
                id: 'type',
                title: 'Publish as a generic Nostr post',
                subTitle:
                    'Use this for your everyday posts. This will reach a wider audience temporarily but will soon be buried by other generic posts.',
                onPress: () => changeType('generic'),
                leftView: (
                    <View style={{ paddingHorizontal: 10 }}>
                        <Type size={24} color={colors.muted} />
                    </View>
                ),
                rightView: (
                    <View className="flex-1 justify-center px-4">
                        <Text className="text-xs text-muted-foreground">Kind 1</Text>
                    </View>
                ),
            },
        ];
    }, [type]);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Publication type',
                }}
            />

            <View className="w-full flex-1 flex-col gap-4 p-4">
                <Text className="text-sm text-muted-foreground">
                    In Nostr all posts are accessible to all apps and users; some apps prioritize displaying certain types of posts.
                </Text>

                <Text className="text-sm text-muted-foreground">
                    Publishing a generic post, it will be mixed with other generic posts and will be buried by them quickly.
                </Text>

                <List
                    data={data}
                    contentContainerClassName="pt-4"
                    contentInsetAdjustmentBehavior="automatic"
                    renderItem={({ item, index, target }) => (
                        <View className="w-full flex-1">
                            <ListItem
                                className={cn(
                                    'ios:pl-0 pl-2',
                                    index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                                )}
                                item={item}
                                leftView={item.leftView}
                                rightView={item.rightView}
                                onPress={item.onPress}
                                index={index}
                                target={target}
                            />
                        </View>
                    )}
                />
            </View>
        </>
    );
}
