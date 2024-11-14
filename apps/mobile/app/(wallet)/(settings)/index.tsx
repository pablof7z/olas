import { useNDK } from '@/ndk-expo';
import { Icon, MaterialIconName } from '@roninoss/icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
import { walleteStore } from '@/app/stores';
import { useStore } from 'zustand';
import { TextInput } from 'react-native-gesture-handler';

export default function SettingsIosStyleScreen() {
    const { ndk, currentUser } = useNDK();
    const { activeWallet } = useStore(walleteStore);

    ndk?.addExplicitRelay('wss://relay.primal.net')

    

    const publishTokens = useCallback(async () => {
        if (!activeWallet) {
            console.log('no wallet')
            return;
        }

        if (activeWallet.tokens.length === 0) {
            alert("No tokens to publish in this wallet")
            return
        }

        for (const token of activeWallet.tokens) {
            try {
                console.log('publishing')
                const relays = await token.publish(activeWallet.relaySet);
                if (relays.size > 0) {
                    console.log("published to relays", relays.values())
                }
            } catch (e) {
                alert(e.message)
            }
        }
    }, [activeWallet])
  
  const [validating, setValidating] = useState<boolean | "validated">(false);

  const validateTokens = useCallback(async () => {
    setValidating(true);
    await activeWallet?.checkProofs();
    setValidating("validated");
    setTimeout(() => {
      setValidating(false);
    }, 1000)
  }, [activeWallet])

  const data = useMemo(() => {
    return [
      {
        id: '2',
        title: 'Relays',
        leftView: <IconView name="wifi" className="bg-blue-500" />,
        onPress: () => router.push('/(wallet)/(settings)/relays')
      },
      {
        id: '3',
        title: 'Mints',
        leftView: <IconView name="backpack" className="bg-orange-500" />,
        onPress: () => router.push('/(wallet)/(settings)/mints')
      },
      'gap 3',
      {
        id: '4',
        title: 'Validate Tokens',
        leftView: <IconView name="magnify" className="bg-destructive" />,
        rightView: validating === 'validated' ? (
            <Icon name="check" />
        ) : validating ? <ActivityIndicator /> : <></>,
        onPress: validateTokens
      },
      {
        id: '5',
        title: 'Publish Tokens',
        leftView: <IconView name="bullhorn" />,
        onPress: publishTokens
      },
      
    ]
  }, [currentUser, validating]);
  
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
          {info.item.rightView ? info.item.rightView : (
            <>
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
            </>
          )}
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
