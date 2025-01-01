import { Icon, MaterialIconName } from '@roninoss/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';

import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { router } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';
import * as User from '@/components/ui/user';
import { useMuteList, useNDKSession, useUserProfile, useWOT } from '@nostr-dev-kit/ndk-mobile';
import { formatMoney } from '@/utils/bitcoin';
import { useNDK, useNDKWallet, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { useAppSettingsStore } from '@/stores/app';

export default function SettingsIosStyleScreen() {
    const { logout } = useNDK();
    const currentUser = useNDKCurrentUser();
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const { activeWallet, balances } = useNDKWallet();
    const defaultBlossomServer = useActiveBlossomServer();
    const muteList = useMuteList();
    const wot = useWOT();
    const resetAppSettings = useAppSettingsStore(s => s.reset);

    console.log('SettingsIosStyleScreen balances', balances);

    const appLogout = useCallback(() => {
        router.back();
        resetAppSettings();
        logout();
    }, [logout, resetAppSettings]);
    
    useEffect(() => {
        console.log('SettingsIosStyleScreen use effect balances', balances);
    }, [balances]);

    const appVersion = useMemo(() => {
        return `${Platform.OS} ${Platform.Version}`;
    }, []);
    // read the app version from expo's app.json
    const buildVersion = useMemo(() => {
        const appJson = require('../../../app.json');
        return appJson.expo.version;
    }, []);

    const data = useMemo(() => {
        const opts: ListDataItem[] = [
            {
                id: '2',
                title: 'Relays',
                leftView: <IconView name="wifi" className="bg-blue-500" />,
                onPress: () => router.push('/(tabs)/(settings)/relays'),
            },
        ];

        if (currentUser) {
            opts.unshift('gap 0');
            // opts.unshift({
            //     id: 'wot',
            //     title: 'Web-of-trust',
            //     leftView: <IconView name="person-outline" className="bg-red-500" />,
            //     rightText: <Text variant="body" className="text-muted-foreground">{wot?.size.toString() ?? '0'}</Text>,
            // });
            opts.unshift({
                id: 'muted',
                title: 'Muted Users',
                leftView: <IconView name="person-outline" className="bg-red-500" />,
                rightText: (
                    <Text variant="body" className="text-muted-foreground">
                        {muteList?.size.toString() ?? '0'}
                    </Text>
                ),
                onPress: () => router.push('/(tabs)/(settings)/muted'),
            });
            opts.unshift({
                id: '0',
                onPress: () => {
                    router.push(`/profile?pubkey=${currentUser.pubkey}`);
                },
                title: (
                    <View className="flex-row items-center gap-2">
                        <View className="flex-col">
                            <User.Avatar userProfile={userProfile} size={32} />

                            <View className="flex-col">
                                <Text className="text-lg">
                                    {' '}
                                    <User.Name userProfile={userProfile} pubkey={currentUser.pubkey} />{' '}
                                </Text>
                            </View>
                        </View>
                    </View>
                ),
            });

            opts.push({
                id: '11',
                title: 'Key',
                leftView: <IconView name="key-outline" className="bg-gray-500" />,
                onPress: () => router.push('/(tabs)/(settings)/key'),
            });
            opts.push('gap 3');
            opts.push({
                id: '12',
                title: 'Wallet',
                leftView: <IconView name="lightning-bolt" className="bg-green-500" />,
                rightText: balances?.length > 0 ? formatMoney(balances[0]) : activeWallet?.walletId,
                onPress: () => router.push(activeWallet ? '/(wallet)' : '/(settings)/wallets'),
            });

            opts.push('gap 5');
            opts.push({
                id: 'blossom',
                title: 'Media Servers',
                leftView: (
                    <IconView>
                        <Text>🌸</Text>
                    </IconView>
                ),
                rightText: defaultBlossomServer,
                onPress: () => router.push('/(tabs)/(settings)/blossom'),
            });
            opts.push('gap 4');
            opts.push({
                id: '4',
                title: 'Logout',
                leftView: <IconView name="send-outline" className="bg-destructive" />,
                onPress: appLogout,
            });
        }

        opts.push('gap 9');
        opts.push({
            id: 'dev',
            title: `Development`,
            leftView: <IconView name="code-braces" className="bg-green-500" />,
            onPress: () => {
                router.push('/(tabs)/(settings)/dev');
            },
        });

        opts.push({
            id: 'version',
            title: `Version ${appVersion} (${buildVersion})`,
        });

        return opts;
    }, [currentUser, activeWallet, balances, muteList, wot, defaultBlossomServer]);

    return (
        <>
            <LargeTitleHeader title="Settings" searchBar={{ iosHideWhenScrolling: true }} rightView={() => <ThemeToggle />} />
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

export function IconView({ className, name, children }: { className?: string; name?: MaterialIconName; children?: React.ReactNode }) {
    return (
        <View className="px-3">
            <View className={cn('h-6 w-6 items-center justify-center rounded-md', className)}>
                {name ? <Icon name={name} size={15} color="white" /> : children}
            </View>
        </View>
    );
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
    return typeof item === 'string' ? item : item.id;
}
