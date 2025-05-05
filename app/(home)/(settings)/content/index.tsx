import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNDKMutes } from '@nostr-dev-kit/ndk-hooks';
import type { RenderTarget } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Switch, View } from 'react-native';

import { IconView } from '@/components/icon-view';
import { LargeTitleHeader } from '@/components/nativewindui/LargeTitleHeader';
import { List, ListItem, ListSectionHeader } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import { useColorScheme } from '@/lib/useColorScheme';
import { type VideosInFeed, useAppSettingsStore } from '@/stores/app';

const videosInFeedToText = (value: VideosInFeed) => {
    if (value === 'none') return 'Disabled';
    else if (value === 'from-follows') return 'From follows';
    else if (value === 'from-all') return 'From everyone';
    else return 'Disabled';
};

export default function ContentScreen() {
    const muteListEvent = useNDKMutes((s) => s.muteList);
    const { videosInFeed, setVideosInFeed, forceSquareAspectRatio, setForceSquareAspectRatio } =
        useAppSettingsStore();
    const { showActionSheetWithOptions } = useActionSheet();

    const videosInFeedActionSheet = useCallback(() => {
        showActionSheetWithOptions(
            {
                options: [
                    videosInFeedToText('none'),
                    videosInFeedToText('from-follows'),
                    videosInFeedToText('from-all'),
                ],
                cancelButtonIndex: 0,
            },
            (buttonIndex) => {
                let value: VideosInFeed;
                if (buttonIndex === 0) value = 'none';
                else if (buttonIndex === 1) value = 'from-follows';
                else if (buttonIndex === 2) value = 'from-all';
                setVideosInFeed(value);
            }
        );
    }, [showActionSheetWithOptions, setVideosInFeed]);

    const items = useMemo(() => {
        const v = [];

        v.push({
            id: 'muted',
            title: 'Muted Content',
            leftView: <IconView name="person-outline" className="bg-red-500" />,
            rightText: muteListEvent?.items?.length.toString() ?? '0',
            goto: '/(home)/(settings)/content/muted',
        });

        v.push('Feed Appearance');

        v.push({
            id: 'videos-in-feed',
            title: 'Videos in Feed',
            subTitle: 'Show videos in the home feed?',
            rightText: videosInFeedToText(videosInFeed),
            onPress: videosInFeedActionSheet,
        });

        v.push({
            id: 'feed-aspect-ratio',
            title: 'Squared Posts',
            subTitle: 'Show posts within a square',
            rightView: (
                <Switch value={forceSquareAspectRatio} onValueChange={setForceSquareAspectRatio} />
            ),
            onPress: () => setForceSquareAspectRatio(!forceSquareAspectRatio),
        });

        return v;
    }, [
        muteListEvent,
        videosInFeed,
        videosInFeedActionSheet,
        forceSquareAspectRatio,
        setForceSquareAspectRatio,
    ]);

    return (
        <>
            <LargeTitleHeader title="Content Preferences" />
            <List
                data={items}
                variant="insets"
                renderItem={({ item, index, target }) => (
                    <Item item={item} index={index} target={target} />
                )}
            />
        </>
    );
}

function Item({ item, index, target }: { item: any; index: number; target: RenderTarget }) {
    const { colors } = useColorScheme();

    if (typeof item === 'string') {
        return <ListSectionHeader item={item} index={index} target={target} />;
    }

    return (
        <ListItem
            item={item}
            index={index}
            target={target}
            leftView={item.leftView}
            onPress={item.onPress ?? (item.goto ? () => router.push(item.goto) : undefined)}
            rightView={
                item.rightView ? (
                    item.rightView
                ) : (
                    <View className="flex-1 flex-row items-center justify-center gap-2 px-4">
                        {item.rightText && (
                            <Text variant="callout" className="ios:px-0 px-2 text-muted-foreground">
                                {item.rightText}
                            </Text>
                        )}
                        {item.badge && (
                            <View className="h-5 w-5 items-center justify-center rounded-full bg-destructive">
                                <Text
                                    variant="footnote"
                                    className="font-bold leading-4 text-destructive-foreground"
                                >
                                    {item.badge}
                                </Text>
                            </View>
                        )}
                        {item.goto && <ChevronRight color={colors.grey3} />}
                    </View>
                )
            }
        />
    );
}
