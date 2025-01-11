import { useNDK, useNDKCurrentUser, useNDKSession, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { Icon, MaterialIconName } from '@roninoss/icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { router } from 'expo-router';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';

export default function WalletSettings() {
    const currentUser = useNDKCurrentUser();
    const { activeWallet, balances, setActiveWallet } = useNDKWallet();
    const [syncing, setSyncing] = useState(false);
    const { colors } = useColorScheme();
    console.log('balances', balances);

    useEffect(() => {
        console.log('use effect balances', balances);
    }, [balances]);

    const forceSync = async () => {
        setSyncing(true);
        const res = await (activeWallet as NDKCashuWallet).checkProofs();
        console.log('forceSync', res);
        setSyncing(false);
    }

    const data = useMemo(() => {
        const opts = [
            {
                id: '2',
                title: 'Relays',
                leftView: <IconView name="wifi" className="bg-blue-500" />,
                onPress: () => router.push('/(wallet)/(walletSettings)/relays')
            },
            {
                id: '3',
                title: 'Mints',
                leftView: <IconView name="home-outline" className="bg-green-500" />,
                onPress: () => router.push('/(wallet)/(walletSettings)/mints'),
            },

            'gap 0',

            {
                id: '4',
                title: 'Force-Sync',
                onPress: forceSync,
                rightView: syncing ? <ActivityIndicator size="small" color={colors.foreground} /> : null
            }
        ];

        if (activeWallet instanceof NDKCashuWallet && (activeWallet as NDKCashuWallet)?.warnings.length > 0) {
            opts.push('Warnings')

            for (const warning of (activeWallet as NDKCashuWallet)?.warnings) {
                opts.push({
                    id: warning.event?.id ?? Math.random().toString(),
                    leftView: <IconView name="alpha-x-box" className="bg-red-500" />,
                    title: warning.msg,
                    subTitle: warning.relays?.map((r) => r.url).join(', '),
                });
            }

            const pendingDeposits = activeWallet.depositMonitor.deposits.size;

            if (pendingDeposits > 0) {
                opts.push({
                    id: '5',
                    title: 'Pending deposits',
                    subTitle: pendingDeposits.toString(),
                });
            }
        }

        return opts;
    }, [currentUser, activeWallet, balances]);

    return (
        <>
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

export function IconView({ className, name, children, size = 24 }: { className?: string; name?: MaterialIconName; children?: React.ReactNode, size?: number }) {
    return (
        <View className="px-3">
            <View style={{ width: size, height: size }} className={cn('items-center justify-center rounded-md', className)}>
                {name ? <Icon name={name} size={size*0.8}  color="white" /> : children}
            </View>
        </View>
    );
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
    return typeof item === 'string' ? item : item.id;
}
