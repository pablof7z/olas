import { useNDK } from "@/ndk-expo";
import { Icon, MaterialIconName } from '@roninoss/icons';
import { useMemo } from 'react';
import { View } from 'react-native';
import * as User from '@/ndk-expo/components/user';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/nativewindui/Avatar';
import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import {
  ESTIMATED_ITEM_HEIGHT,
  List,
  ListDataItem,
  ListItem,
  ListRenderItemInfo,
  ListSectionHeader,
} from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { router } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SettingsIosStyleScreen() {
  const { currentUser, logout } = useNDK();

  const data = useMemo(() => {
    const opts = [
      {
        id: '2',
        title: 'Relays',
        leftView: <IconView name="wifi" className="bg-blue-500" />,
        onPress: () => router.push('/(settings)/relays')
      }
    ];

    if (currentUser) {
        opts.push({
            id: '11',
            title: 'Key',
            leftView: <IconView name="key-outline" className="bg-gray-500" />,
            onPress: () => router.push('/(settings)/key')
        });
        opts.push('gap 3');
        opts.push({
          id: 'blossom',
          title: 'Media Servers',
          leftView: <IconView name="server" className="bg-pink-500" />,
          onPress: () => alert('Not ready yet')
        });
        opts.push('gap 4');
        opts.push({
            id: '4',
            title: 'Logout',
            leftView: <IconView name="send-outline" className="bg-destructive" />,
            onPress: () => {
              router.back();
              logout();
            }
        })
    }

    return opts;
  }, [currentUser]);

  return (
    <>
      <LargeTitleHeader
        title="Settings"
        searchBar={{ iosHideWhenScrolling: true }}
        rightView={() => <ThemeToggle />}
      />
      <List
        contentContainerClassName="pt-4"
        contentInsetAdjustmentBehavior="automatic"
        variant="insets"
        data={data}
        estimatedItemSize={ESTIMATED_ITEM_HEIGHT.titleOnly}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        sectionHeaderAsGap
      />
    </>
  );
}

function renderItem<T extends (typeof data)[number]>(info: ListRenderItemInfo<T>) {
  if (typeof info.item === 'string') {
    return <ListSectionHeader {...info} />;
  }
  return (
    <ListItem
      className={cn(
        'ios:pl-0 pl-2',
        info.index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
      )}
      titleClassName="text-lg"
      leftView={info.item.leftView}
      rightView={
        <View className="flex-1 flex-row items-center justify-center gap-2 px-4">
          {info.item.rightText && (
            <Text variant="callout" className="ios:px-0 text-muted-foreground px-2">
              {info.item.rightText}
            </Text>
          )}
          {info.item.badge && (
            <View className="bg-destructive h-5 w-5 items-center justify-center rounded-full">
              <Text variant="footnote" className="text-destructive-foreground font-bold leading-4">
                {info.item.badge}
              </Text>
            </View>
          )}
          <ChevronRight />
        </View>
      }
      {...info}
      onPress={() => info.item.onPress?.()}
    />
  );
}

function ChevronRight() {
  const { colors } = useColorScheme();
  return <Icon name="chevron-right" size={17} color={colors.grey} />;
}

function IconView({ className, name }: { className?: string; name: MaterialIconName }) {
  return (
    <View className="px-3">
      <View className={cn('h-6 w-6 items-center justify-center rounded-md', className)}>
        <Icon name={name} size={15} color="white" />
      </View>
    </View>
  );
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
  return typeof item === 'string' ? item : item.id;
}
