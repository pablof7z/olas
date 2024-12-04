import { NDKCashuMintList, NDKEvent, NDKKind, useNDK, useNDKSession, useNDKSessionEvents } from '@nostr-dev-kit/ndk-mobile';
import { Icon } from '@roninoss/icons';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { NDKRelay, NDKRelayStatus } from '@nostr-dev-kit/ndk-mobile';
import * as SecureStore from 'expo-secure-store';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Button } from '@/components/nativewindui/Button';
import { NDKCashuWallet, NDKWallet } from '@nostr-dev-kit/ndk-wallet';
import { IconView } from '.';

export default function WalletsScreen() {
    const { ndk } = useNDK();
    const { activeWallet, setActiveWallet } = useNDKSession();
    const allWallets = useNDKSessionEvents([NDKKind.CashuWallet]);
    const [searchText, setSearchText] = useState<string | null>(null);
    const [relays, setRelays] = useState<NDKRelay[]>(Array.from(ndk!.pool.relays.values()));
    const [url, setUrl] = useState('');

    const activateWallet = async (wallet: NDKEvent) => {
        router.back();
        const w = await NDKCashuWallet.from(wallet);
        setActiveWallet(w);
    }

    const data = useMemo(() => {
        if (!ndk) return [];

        const options = Array.from(allWallets.values())
            .map((walletEvent: NDKEvent) => ({
                id: walletEvent.id,
                title: walletEvent.dTag,
                subTitle: walletEvent.getMatchingTags('mint').length + ' mint(s)',
                onPress: () => activateWallet(walletEvent),
                rightView: (
                    <View className="flex-1 items-center px-2">
                        <Button variant="secondary" size="sm" onPress={() => activateWallet(walletEvent)}>
                            <Text>Use</Text>
                        </Button>
                    </View>
                ),
            }))
            .filter((item) => (searchText ?? '').trim().length === 0 || item.title.match(searchText!));
        
        if (options.length > 0) {
            options.unshift('Existing Wallets');
        }
        
        options.push('New Wallet');

        options.push({
            id: 'nip60',
            title: 'Nostr-Native Wallet',
            leftView: <IconView name="lightning-bolt" className="bg-orange-500" />,
            subTitle: 'Create a new NIP-60 wallet',
            onPress: () => {
                newWallet().then(() => {
                    router.back();
                });
            },
        });

        options.push({
            id: 'nwc',
            title: 'Nostr Wallet Connect',
            leftView: <IconView name="link" className="bg-gray-500" />,
            subTitle: 'Connect to a Nostr Wallet',
            onPress: () => {
                router.push('nwc')
            },
        });

        return options;
    }, [ndk?.pool.relays, searchText, allWallets]);

    function save() {
        SecureStore.setItemAsync('relays', relays.map((r) => r.url).join(','));
        router.back();
    }

    async function newWallet() {
        console.log('creating new wallet');
        const wallet = NDKCashuWallet.create(ndk, ['https://mint.coinos.io'], Array.from(ndk!.pool.relays.values()).map((r) => r.url));
        wallet.name = 'My Wallet';
        await wallet.getP2pk();
        await wallet.publish().then(() => {
            setActiveWallet(wallet);
            const mintList = new NDKCashuMintList(ndk);
            mintList.mints = wallet.mints;
            mintList.p2pk = wallet.p2pk;
            mintList.relays = wallet.relays;
            mintList.publishReplaceable();
        });
    }
    
    return (
        <>
            <LargeTitleHeader
                title={`Wallets`}
                searchBar={{
                    iosHideWhenScrolling: true,
                    onChangeText: setSearchText,
                }}
                rightView={() => (
                    <TouchableOpacity onPress={save}>
                        <Text className="text-primary">Save</Text>
                    </TouchableOpacity>
                )}
            />
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
    if (info.item.id === 'add') {
        return (
            <ListItem
                className={cn('ios:pl-0 pl-2', info.index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
                titleClassName="text-lg"
                leftView={info.item.leftView}
                rightView={
                    <TouchableOpacity onPress={info.item.fn}>
                        <Text className="mt-2 pr-4 text-primary">Add</Text>
                    </TouchableOpacity>
                }
                {...info}>
                <TextInput
                    className="flex-1 text-lg text-foreground"
                    placeholder="Add relay"
                    onChangeText={info.item.set}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </ListItem>
        );
    } else if (typeof info.item === 'string') {
        return <ListSectionHeader {...info} />;
    }
    return (
        <ListItem
            className={cn('ios:pl-0 pl-2', info.index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
            titleClassName="text-lg"
            leftView={info.item.leftView}
            rightView={
                info.item.rightView ?? (
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
                )
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

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
    return typeof item === 'string' ? item : item.id;
}
