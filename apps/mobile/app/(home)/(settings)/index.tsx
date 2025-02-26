import { Icon, MaterialIconName } from '@roninoss/icons';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, Switch, View } from 'react-native';

import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { router, Stack } from 'expo-router';
import { ThemeToggle } from '@/components/ThemeToggle';
import * as User from '@/components/ui/user';
import { NDKCacheAdapterSqlite, useNDKUnpublishedEvents, useUserProfile, useWOT } from '@nostr-dev-kit/ndk-mobile';
import { useNDK, useNDKWallet, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { useAppSettingsStore } from '@/stores/app';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import { Button } from '@/components/nativewindui/Button';
import { humanWalletType } from '@/utils/wallet';
import { IconView } from '@/components/icon-view';
import { toast } from '@backpackapp-io/react-native-toast';
import { WALLET_ENABLED } from '@/utils/const';

const relaysItem = {
    id: 'relays',
    title: 'Relays',
    leftView: <IconView name="wifi" className="bg-blue-500" />,
    onPress: () => router.push('/(home)/(settings)/relays'),
};

const keyItem = {
    id: 'key',
    title: 'Key',
    leftView: <IconView name="key-outline" className="bg-gray-500" />,
    onPress: () => router.push('/(home)/(settings)/key'),
};

const walletItem = {
    id: 'wallet',
    title: 'Wallet',
    leftView: <IconView name="lightning-bolt" className="bg-green-500" />,
    onPress: () => router.push('/(home)/(settings)/wallets'),
};

const devItem = {
    id: 'dev',
    title: `Development`,
    leftView: <IconView name="code-braces" className="bg-green-500" />,
    onPress: () => {
        router.push('/(home)/(settings)/dev');
    },
};

const emptyCache = {
    id: 'cache-empty',
    title: 'Empty content cache',
    leftView: <IconView name="tray-arrow-up" className="bg-red-500" />,
    onPress: () => {
        Image.clearDiskCache();
        Image.clearMemoryCache();
        toast.success('Content cache cleared');
    }
}

export default function SettingsIosStyleScreen() {
    const { ndk, logout } = useNDK();
    const currentUser = useNDKCurrentUser();
    const { userProfile } = useUserProfile(currentUser?.pubkey);
    const { activeWallet, setActiveWallet } = useNDKWallet();
    const defaultBlossomServer = useActiveBlossomServer();
    const wot = useWOT();
    const unpublishedEvents = useNDKUnpublishedEvents();
    const resetAppSettings = useAppSettingsStore(s => s.reset);
    const unlinkWallet = useAppSettingsStore(s => s.unlinkWallet);
    const toggleAdvancedMode = useAppSettingsStore(s => s.toggleAdvancedMode)
    const advancedMode = useAppSettingsStore(s => s.advancedMode);

    const appLogout = useCallback(() => {
        router.back();
        resetAppSettings();
        SecureStore.setItem('timeSinceLastAppSync', '0');
        logout();
    }, [logout, resetAppSettings]);
    
    const appVersion = useMemo(() => {
        return `${Platform.OS} ${Platform.Version}`;
    }, []);
    // read the app version from expo's app.json
    const buildVersion = useMemo(() => {
        const appJson = require('../../../app.json');
        return appJson.expo.version;
    }, []);

    const handleUnlinkWallet = useCallback(() => {
        unlinkWallet();
        setActiveWallet(null);
    }, [unlinkWallet, setActiveWallet]);

    const handleNukeDatabase = useCallback(() => {
        const db = (ndk?.cacheAdapter as NDKCacheAdapterSqlite).db
        // get all the tables and delete them
        db.runSync(`DROP TABLE IF EXISTS events;`);
        db.runSync(`DROP TABLE IF EXISTS profiles;`);
        db.runSync(`DROP TABLE IF EXISTS relay_status;`);
        db.runSync(`DROP TABLE IF EXISTS event_tags;`);
        db.runSync(`PRAGMA user_version = 0;`);
        toast.success('Local database reset successfully');
        process.exit(0);
    }, [ndk]);

    const data = useMemo(() => {
        const opts: ListDataItem[] = [];
        
        if (currentUser) {
            // opts.unshift({
            //     id: 'wot',
            //     title: 'Web-of-trust',
            //     leftView: <IconView name="person-outline" className="bg-red-500" />,
            //     rightText: <Text variant="body" className="text-muted-foreground">{wot?.size.toString() ?? '0'}</Text>,
            // });
            
            opts.push({
                id: 'profile',
                onPress: () => {
                    router.push(`/profile?pubkey=${currentUser.pubkey}`);
                },
                title: (<View className="flex-row gap-4 items-center">
                    <User.Avatar pubkey={currentUser.pubkey} userProfile={userProfile} imageSize={24} canSkipBorder={true} />
                    <User.Name userProfile={userProfile} pubkey={currentUser.pubkey} className="text-foreground text-lg font-medium" />
                </View>
                ),
            });
            
            if (advancedMode) {
                if (unpublishedEvents.length) {
                    opts.push(' ')
                    opts.push({
                        id: 'unpublished-events',
                        title: 'Unpublished Events',
                        leftView: (<IconView name="warning" className="bg-green-500" />),
                        rightText: unpublishedEvents.length,
                        onPress: () => router.push('/unpublished')
                    }); 
                }
            }
            
            if (WALLET_ENABLED) {
                opts.push('Wallet & zaps')
                if (activeWallet) {
                    console.log('activeWallet', activeWallet);
                    let name = activeWallet.type.toString();
                    if (activeWallet instanceof NDKCashuWallet)
                        name = activeWallet.name || activeWallet.walletId;

                    opts.push({
                        id: 'wallet-balance',
                        title: "Wallet",
                        subTitle: humanWalletType(activeWallet.type),
                        leftView: <IconView name="lightning-bolt" className="bg-orange-500" />,
                        rightView: <View className="items-center justify-center flex-col m-2">
                            <Button variant="secondary" className="flex-col"
                                onPress={handleUnlinkWallet}>
                                <Text className="text-sm font-medium text-red-500">Unlink</Text>
                            </Button>
                        </View>,
                        onPress: () => {
                            if (!activeWallet) return;
                            activeWallet.updateBalance?.();
                            router.push('/(home)/(wallet)')
                        }
                    });

                    opts.push({
                        id: 'zaps',
                        title: 'Zaps',
                        leftView: <IconView name="lightning-bolt" className="bg-yellow-500" />,
                        onPress: () => router.push('/(home)/(settings)/zaps'),
                    })
                } else {
                    opts.push(walletItem)
                }
            }

            opts.push('      ');

            opts.push({
                id: 'content',
                title: 'Content Preferences',
                subTitle: 'Manage the type of content you see',
                leftView: <IconView name="text" className="bg-purple-500" />,
                onPress: () => router.push('/(home)/(settings)/content'),
            });

            if (advancedMode) {
                opts.push('  ');

                opts.push({
                    id: 'blossom',
                    title: 'Media Servers',
                    subTitle: defaultBlossomServer,
                    leftView: (
                        <IconView>
                            <Text>🌸</Text>
                        </IconView>
                    ),
                    onPress: () => router.push('/(home)/(settings)/blossom'),
                });
            }
        }

        if (advancedMode) { 
            opts.push('   ');

            opts.push(relaysItem);
            opts.push(keyItem);
        }
        
        opts.push('    ');

        opts.push({
            id: '4',
            title: 'Logout',
            leftView: <IconView name="send-outline" className="bg-destructive" />,
            onPress: appLogout,
        });

        opts.push('        ');

        opts.push({
            id: 'advanced',
            title: 'Advanced',
            subTitle: 'Settings for advanced users',
            rightView: <Switch value={advancedMode} onValueChange={toggleAdvancedMode} style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }} />,
        })
        if (advancedMode) {
            opts.push(devItem);
            opts.push(emptyCache);
            opts.push({
                id: 'nuke-database',
                title: 'Reset local database',
                leftView: <IconView name="database-remove" className="bg-red-500" />,
                onPress: handleNukeDatabase,
            });
        }

        if (advancedMode) {
            opts.push('       ');

            opts.push({
                id: 'delete',
                title: 'Delete Account',
                leftView: <IconView name="delete-outline" className="bg-destructive" />,
                onPress: () => router.push('/(home)/(settings)/delete-account'),
            });

            opts.push(`Version ${appVersion} (${buildVersion})`);
        }

        return opts;
    }, [currentUser, activeWallet?.walletId, wot, defaultBlossomServer, unpublishedEvents.length, advancedMode]);

    return (
        <>
            <Stack.Screen options={{ title: 'Settings', headerRight: () => <ThemeToggle /> }} />
            <List
                contentContainerClassName="pt-4"
                contentInsetAdjustmentBehavior="automatic"
                variant="insets"
                data={data}
                estimatedItemSize={ESTIMATED_ITEM_HEIGHT.titleOnly}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
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
                (info.item.rightView ? info.item.rightView : (
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
            ))}
            {...info}
            onPress={() => info.item.onPress?.()}
        />
    );
}

function ChevronRight() {
    const { colors } = useColorScheme();
    return <Icon name="chevron-right" size={17} color={colors.grey} />;
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
    return typeof item === 'string' ? item : item.id;
}
