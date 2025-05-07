import { toast } from '@backpackapp-io/react-native-toast';
import { useNDKWallet } from '@nostr-dev-kit/ndk-hooks';
import {
    useCurrentUserProfile,
    useNDK,
    useNDKCurrentUser,
    useNDKSessionLogout,
    useNDKUnpublishedEvents,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import { Icon } from '@roninoss/icons';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useMemo } from 'react';
import { Platform, Switch, View } from 'react-native';

import { ThemeToggle } from '@/components/ThemeToggle';
import { IconView } from '@/components/icon-view';
import { Button } from '@/components/nativewindui/Button';
import * as User from '@/components/ui/user';
import { useActiveBlossomServer } from '@/hooks/blossom';
import { useAppSettingsStore } from '@/stores/app';
import { WALLET_ENABLED } from '@/utils/const';
import { humanWalletType } from '@/utils/wallet';
import {
    ESTIMATED_ITEM_HEIGHT,
    List,
    type ListDataItem,
    ListItem,
    type ListRenderItemInfo,
    ListSectionHeader,
} from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';

// ... (Keep const definitions for items like relaysItem, keyItem, etc. from lines 39-87)
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
    title: 'Development',
    leftView: <IconView name="code-braces" className="bg-green-500" />,
    onPress: () => {
        router.push('/(home)/(settings)/dev');
    },
};

const viewCacheContent = {
    id: 'cache-view',
    title: 'View Content cache',
    leftView: <IconView name="tray-arrow-up" className="bg-red-500" />,
    onPress: () => {
        router.push('/(home)/(settings)/content/cache');
    },
};

const emptyCache = {
    id: 'cache-empty',
    title: 'Empty Content cache',
    leftView: <IconView name="tray-arrow-up" className="bg-red-500" />,
    onPress: () => {
        Image.clearDiskCache();
        Image.clearMemoryCache();
        toast.success('Content cache cleared');
    },
};

export default function SettingsIosStyleScreen() {
    const { ndk } = useNDK();
    const ndkLogout = useNDKSessionLogout();
    const currentUser = useNDKCurrentUser();
    const userProfile = useCurrentUserProfile();
    const { activeWallet, setActiveWallet } = useNDKWallet();
    const defaultBlossomServer = useActiveBlossomServer();
    const unpublishedEvents = useNDKUnpublishedEvents();
    const resetAppSettings = useAppSettingsStore((s) => s.reset);
    const unlinkWallet = useAppSettingsStore((s) => s.unlinkWallet);
    const toggleAdvancedMode = useAppSettingsStore((s) => s.toggleAdvancedMode);
    const advancedMode = useAppSettingsStore((s) => s.advancedMode);
    const useImageLoaderQueue = useAppSettingsStore((s) => s.useImageLoaderQueue);
    const setUseImageLoaderQueue = useAppSettingsStore((s) => s.setUseImageLoaderQueue);

    const appLogout = useCallback(() => {
        if (!currentUser) return;
        router.back();
        resetAppSettings();
        SecureStore.setItem('timeSinceLastAppSync', '0');
        ndkLogout(currentUser.pubkey);
    }, [resetAppSettings]); // Changed dependency

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
        // Check if the adapter has a 'db' property before casting
        if (ndk?.cacheAdapter && typeof (ndk.cacheAdapter as any).db?.runSync === 'function') {
            const db = (ndk.cacheAdapter as any).db; // Use 'any' for the cast after check
            // get all the tables and delete them
            db.runSync('DROP TABLE IF EXISTS events;');
            db.runSync('DROP TABLE IF EXISTS profiles;');
            db.runSync('DROP TABLE IF EXISTS relay_status;');
            db.runSync('DROP TABLE IF EXISTS event_tags;');
            db.runSync('PRAGMA user_version = 0;');
            toast.success('Local database reset successfully');
            process.exit(0);
        } else {
            toast.error('Could not access database to reset.');
        }
    }, [ndk]);

    // Define the configuration for list items separately
    const itemsConfig = useMemo(() => {
        const config: Array<string | { type: string; title: string; subTitle?: string }> = [];

        if (currentUser) {
            config.push({
                type: 'profile',
                title:
                    userProfile?.name ||
                    userProfile?.displayName ||
                    userProfile?.nip05 ||
                    currentUser.pubkey.substring(0, 8),
            });

            if (advancedMode) {
                if (unpublishedEvents.length) {
                    config.push(' '); // Section separator
                    config.push({
                        type: 'unpublished-events',
                        title: 'Unpublished Events',
                        subTitle: `${unpublishedEvents.length} items`,
                    });
                }
            }

            if (WALLET_ENABLED) {
                config.push('Wallet & zaps'); // Section header
                if (activeWallet) {
                    let _name = activeWallet.type.toString();
                    if (activeWallet instanceof NDKCashuWallet) _name = activeWallet.walletId;
                    config.push({
                        type: 'wallet-balance',
                        title: 'Wallet',
                        subTitle: humanWalletType(activeWallet.type),
                    });
                    config.push({ type: 'zaps', title: 'Zaps' });
                } else {
                    config.push({ type: 'wallet-setup', title: 'Wallet' });
                }
            }

            config.push('      '); // Section separator

            config.push({
                type: 'content',
                title: 'Content Preferences',
                subTitle: 'Manage the type of content you see',
            });

            if (advancedMode) {
                config.push('  '); // Section separator
                config.push({
                    type: 'blossom',
                    title: 'Media Servers',
                    subTitle: defaultBlossomServer,
                });
            }
        }

        if (advancedMode) {
            config.push('   '); // Section separator
            config.push({ type: 'relays', title: 'Relays' });
            config.push({ type: 'key', title: 'Key' });
        }

        if (currentUser?.pubkey) {
            config.push('    '); // Section separator
            config.push({ type: 'logout', title: 'Logout' });
        }

        config.push('        '); // Section separator

        config.push({
            type: 'advanced-toggle',
            title: 'Advanced',
            subTitle: 'Settings for advanced users',
        });

        if (advancedMode) {
            config.push({
                type: 'image-loader-queue',
                title: 'Use Image Loader Queue',
                subTitle: 'Enable or disable the image loader queue',
            });
            config.push({ type: 'dev', title: 'Development' });
            config.push({ type: 'image-debug', title: 'Image Preload Debug' });
            config.push({ type: 'cache-view', title: 'View Content cache' });
            config.push({ type: 'cache-empty', title: 'Empty Content cache' });
            config.push({ type: 'nuke-database', title: 'Reset local database' });
        }

        config.push(`Version ${appVersion} (${buildVersion})`); // Footer string

        if (currentUser?.pubkey) {
            config.push('       '); // Section separator
            config.push({ type: 'delete', title: 'Delete Account' });
        }
        return config;
    }, [
        currentUser, // Use currentUser object
        activeWallet, // Use activeWallet object
        defaultBlossomServer,
        unpublishedEvents.length,
        advancedMode,
        userProfile, // Use userProfile object
        appVersion,
        buildVersion,
        // Handlers are used in renderItem, no need for dependency here if renderItem is defined in scope
    ]);

    // Map the config to the format expected by the List component's data prop
    const dataForList = useMemo(() => {
        return itemsConfig.map((item) => {
            if (typeof item === 'string') return item;
            return { title: item.title, subTitle: item.subTitle };
        });
    }, [itemsConfig]);

    // Define renderItem within the component scope to access state and handlers
    const renderItem = useCallback(
        (info: ListRenderItemInfo<ListDataItem>) => {
            const configItem = itemsConfig[info.index]; // Get full config using index

            if (typeof info.item === 'string') {
                // Handle section headers (string items) and footers
                if (info.item.startsWith('Version')) {
                    return (
                        <ListSectionHeader
                            {...info}
                            textClassName="normal-case text-muted-foreground text-center"
                        />
                    );
                }
                return <ListSectionHeader {...info} />;
            }

            // Handle object items based on the 'type' stored in configItem
            let leftView: React.ReactNode = null;
            let rightView: React.ReactNode = <ChevronRight />;
            let onPress: (() => void) | undefined = undefined;
            let itemTitle: string | React.ReactNode = info.item.title; // Default to string title

            // Assign props based on type from the original config
            switch (
                typeof configItem === 'object' ? configItem.type : null // Handle string case
            ) {
                case 'profile':
                    // Use React Node for title to include Avatar and Name
                    itemTitle = (
                        <View className="flex-row items-center gap-4">
                            <User.Avatar
                                pubkey={currentUser?.pubkey ?? ''} // Pass empty string if undefined
                                userProfile={userProfile}
                                imageSize={24}
                                canSkipBorder
                            />
                            <User.Name
                                userProfile={userProfile}
                                pubkey={currentUser?.pubkey ?? ''} // Pass empty string if undefined
                                className="text-lg font-medium text-foreground"
                            />
                        </View>
                    );
                    leftView = null; // Avatar/Name are now part of the title element
                    onPress = () => {
                        if (currentUser?.pubkey)
                            router.push(`/profile?pubkey=${currentUser.pubkey}`); // Check pubkey exists
                    };
                    break;
                case 'unpublished-events':
                    leftView = <IconView name="delete-circle-outline" className="bg-orange-500" />;
                    rightView = (
                        <View className="flex-1 flex-row items-center justify-center gap-2 px-4">
                            <Text variant="callout" className="ios:px-0 px-2 text-muted-foreground">
                                {unpublishedEvents.length}
                            </Text>
                            <ChevronRight />
                        </View>
                    );
                    onPress = () => router.push('/unpublished');
                    break;
                case 'wallet-balance':
                    leftView = <IconView name="lightning-bolt" className="bg-orange-500" />;
                    rightView = (
                        <View className="m-2 flex-col items-center justify-center">
                            <Button
                                variant="secondary"
                                className="flex-col"
                                onPress={handleUnlinkWallet}
                            >
                                <Text className="text-sm font-medium text-red-500">Unlink</Text>
                            </Button>
                        </View>
                    );
                    onPress = () => {
                        if (!activeWallet) return;
                        activeWallet?.updateBalance?.(); // Check activeWallet exists
                        router.push('/(home)/(wallet)');
                    };
                    break;
                case 'zaps':
                    leftView = <IconView name="lightning-bolt" className="bg-yellow-500" />;
                    onPress = () => router.push('/(home)/(settings)/zaps');
                    break;
                case 'wallet-setup':
                    leftView = <IconView name="lightning-bolt" className="bg-green-500" />;
                    onPress = () => router.push('/(home)/(settings)/wallets');
                    break;
                case 'content':
                    leftView = <IconView name="format-list-bulleted" className="bg-purple-500" />;
                    onPress = () => router.push('/(home)/(settings)/content');
                    break;
                case 'blossom':
                    leftView = (
                        <IconView>
                            <Text>🌸</Text>
                        </IconView>
                    );
                    onPress = () => router.push('/(home)/(settings)/blossom');
                    break;
                case 'relays':
                    leftView = <IconView name="wifi" className="bg-blue-500" />;
                    onPress = () => router.push('/(home)/(settings)/relays');
                    break;
                case 'key':
                    leftView = <IconView name="key-outline" className="bg-gray-500" />;
                    onPress = () => router.push('/(home)/(settings)/key');
                    break;
                case 'logout':
                    leftView = <IconView name="power" className="bg-destructive" />; // Trying 'power' icon again
                    onPress = appLogout;
                    break;
                case 'advanced-toggle':
                    leftView = null; // No icon needed for toggle usually
                    rightView = (
                        <Switch
                            value={advancedMode}
                            onValueChange={toggleAdvancedMode}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    );
                    break;
                case 'image-loader-queue':
                    leftView = null;
                    rightView = (
                        <Switch
                            value={useImageLoaderQueue}
                            onValueChange={setUseImageLoaderQueue}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    );
                    break;
                case 'dev':
                    leftView = <IconView name="code-braces" className="bg-green-500" />;
                    onPress = () => router.push('/(home)/(settings)/dev');
                    break;
                case 'image-debug':
                    leftView = <IconView name="image" className="bg-green-500" />;
                    onPress = () => router.push('/(home)/(settings)/image-debug');
                    break;
                case 'cache-view':
                    leftView = <IconView name="tray-arrow-up" className="bg-red-500" />;
                    onPress = () => router.push('/(home)/(settings)/content/cache');
                    break;
                case 'cache-empty':
                    leftView = <IconView name="tray-arrow-up" className="bg-red-500" />;
                    onPress = () => {
                        Image.clearDiskCache();
                        Image.clearMemoryCache();
                        toast.success('Content cache cleared');
                    };
                    break;
                case 'nuke-database':
                    leftView = <IconView name="database-remove-outline" className="bg-red-500" />;
                    onPress = handleNukeDatabase;
                    break;
                case 'delete':
                    leftView = <IconView name="delete-off-outline" className="bg-destructive" />; // Using suggested icon
                    onPress = () => router.push('/(home)/(settings)/delete-account');
                    break;
                default:
                    rightView = null;
                    break;
            }

            return (
                <ListItem
                    // Pass item which contains { title, subTitle }
                    item={{ ...info.item, title: itemTitle as string }} // Cast title
                    // Pass other props determined by the switch case
                    leftView={leftView}
                    rightView={rightView}
                    onPress={onPress}
                    // Pass original ListRenderItemInfo props
                    index={info.index}
                    target={info.target}
                    // separators={info.separators} // Removed
                    // Pass props needed by ListItem internal logic
                    // isFirstInSection={info.isFirstInSection} // Removed
                    // isLastInSection={info.isLastInSection} // Removed
                    // variant={info.variant} // Removed
                    // sectionHeaderAsGap={info.sectionHeaderAsGap} // Removed
                    // Add styling etc.
                    className={cn(
                        'ios:pl-0 pl-2',
                        info.index === 0 &&
                            'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                    )}
                    titleClassName="text-lg" // Apply default title class
                />
            );
        },
        [
            itemsConfig,
            currentUser,
            userProfile,
            activeWallet,
            unpublishedEvents,
            advancedMode,
            defaultBlossomServer,
            useImageLoaderQueue,
            handleUnlinkWallet,
            appLogout,
            toggleAdvancedMode,
            handleNukeDatabase,
        ]
    ); // Add dependencies used inside renderItem

    const { colors } = useColorScheme();

    return (
        <View style={{ backgroundColor: colors.card, flex: 1 }}>
            <Stack.Screen
                options={{
                    title: 'Settings',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { color: colors.foreground },
                    headerTintColor: colors.foreground,
                    headerRight: () => <ThemeToggle />,
                }}
            />
            <List
                contentContainerClassName="pt-4"
                contentInsetAdjustmentBehavior="automatic"
                variant="insets"
                data={dataForList} // Use the mapped data
                estimatedItemSize={ESTIMATED_ITEM_HEIGHT.titleOnly}
                renderItem={renderItem} // Use the memoized renderItem
                keyExtractor={keyExtractor} // Use the updated keyExtractor
            />
        </View>
    );
}

// Removed duplicate renderItem function

function ChevronRight() {
    const { colors } = useColorScheme();
    return <Icon name="chevron-right" size={24} color={colors.grey} />;
}

function keyExtractor(item: ListDataItem | string, index: number): string {
    if (typeof item === 'string') return `header-${index}`;
    return item.title ?? `item-${index}`; // Use title or index as key
}
