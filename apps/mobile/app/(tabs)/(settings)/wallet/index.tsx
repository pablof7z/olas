import { useNDK } from '@/ndk-expo';
import { Icon, MaterialIconName } from '@roninoss/icons';
import { useMemo } from 'react';
import { View } from 'react-native';

import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { router } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';
import * as User from '@/ndk-expo/components/user';
import { useNDKWallet } from '@/ndk-expo/providers/wallet';
import { walleteStore } from '@/app/stores';
import { useStore } from 'zustand';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
export default function SettingsIosStyleScreen() {
    const { currentUser, logout } = useNDK();
    const { walletService } = useNDKWallet();
    const { activeWallet, setActiveWallet } = useStore(walleteStore);

    const data = useMemo(() => {
        const opts = [
            {
                id: '2',
                title: 'Relays',
                leftView: <IconView name="wifi" className="bg-blue-500" />,
                onPress: () => router.push('/(settings)/wallet/relays'),
            },
            {
                id: '3',
                title: 'Mints',
                leftView: <IconView name="wallet" className="bg-green-500" />,
                onPress: () => router.push('/(settings)/wallet/mints'),
            },
        ];

        return opts;
    }, [walletService?.wallets, activeWallet]);

    return (
        <>
            <LargeTitleHeader title="Wallet" />
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
            className={cn('ios:pl-0 pl-2', info.index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
            titleClassName="text-lg"
            leftView={info.item.leftView}
            rightView={
                <View className="flex-1 flex-row items-center justify-center gap-2 px-4">
                    {info.item.rightText && (
                        <Text variant="callout" className="ios:px-0 px-2 text-muted-foreground">
                            {info.item.rightText}
                        </Text>
                    )}
                    {info.item.badge && (
                        <View className="h-5 w-5 items-center justify-center rounded-full bg-destructive">
                            <Text variant="footnote" className="font-bold leading-4 text-destructive-foreground">
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
