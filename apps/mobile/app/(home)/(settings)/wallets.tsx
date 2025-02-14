import { NDKCashuMintList, NDKEvent, NDKKind, useNDK, useNDKCurrentUser, useNDKSessionEventKind, useNDKSessionEventKindAsync, useNDKSessionEvents, useNDKWallet, useSubscribe } from '@nostr-dev-kit/ndk-mobile';
import { Image } from 'react-native';
import { Icon } from '@roninoss/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { NDKRelay, NDKRelayStatus } from '@nostr-dev-kit/ndk-mobile';
import * as SecureStore from 'expo-secure-store';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { NDKCashuWallet, NDKWallet } from '@nostr-dev-kit/ndk-wallet';
import { createNip60Wallet } from '@/utils/wallet';
import { IconView } from '@/components/icon-view';
import { DEV_BUILD } from '@/utils/const';

export default function WalletsScreen() {
    const { ndk } = useNDK();
    const { activeWallet, setActiveWallet } = useNDKWallet();
    const [searchText, setSearchText] = useState<string | null>(null);
    const [relays, setRelays] = useState<NDKRelay[]>(Array.from(ndk!.pool.relays.values()));
    const currentUser = useNDKCurrentUser();

    const { events: mintList } = useSubscribe(currentUser ? [
        { kinds: [NDKKind.CashuMintList], authors: [currentUser.pubkey]}
    ] : false, { wrap: true, closeOnEose: true }) as { events: NDKCashuMintList[] }

    const { events: wallets } = useSubscribe(currentUser ? [
        { kinds: [NDKKind.CashuWallet], authors: [currentUser.pubkey]}
    ] : false)

    const activateWallet = async (wallet: NDKCashuWallet) => {
        router.back();
        setActiveWallet(wallet);
    };

    const nip60Wallet = useNDKSessionEventKindAsync<NDKCashuWallet>(NDKCashuWallet);
    
    const [primalSupported, setPrimalSupported] = useState(false);

    useEffect(() => {
        Linking.canOpenURL('nostrnwc+primal://').then((supported) => {
            setPrimalSupported(supported);
        }).catch((e) => {
            // alert(e.message);
            setPrimalSupported(false);
        });
    }, []);

    const data = useMemo(() => {
        if (!ndk) return [];

        const options: ListDataItem[] = [];

        if (nip60Wallet) {
            options.push({
                id: 'nip60',
                title: 'Nostr-Native Wallet',
                leftView: <IconView name="lightning-bolt" className="bg-orange-500 rounded-lg" />,
                subTitle: 'Use nostr-native NIP-60 wallet',
                disabled: true,
                onPress: () => {
                    activateWallet(nip60Wallet);
                    router.back();
                },
            });
        } else {
            options.push({
                id: 'nip60',
                title: 'Nostr-Native Wallet',
                leftView: <IconView name="lightning-bolt" className="bg-orange-500 rounded-lg" />,
                subTitle: 'Create a nostr-native NIP-60 wallet',
                disabled: true,
                onPress: () => {
                    newWallet().then(() => {
                        router.back();
                    });
                },
            });
        }

        options.push({
            id: 'nwc',
            title: 'Nostr Wallet Connect',
            leftView: <IconView name="link" className="bg-gray-500 rounded-lg" />,
            subTitle: 'Connect to a Nostr Wallet',
            onPress: () => {
                router.push('/(home)/(settings)/nwc');
            },
        });

        if (primalSupported) {
            options.push('Wallet Apps')
            
            options.push({
                id: 'primal',
                title: 'Connect Primal Wallet',
                leftView: <Image source={require('../../../assets/primal.png')} className="mx-2.5 w-11 h-11 rounded-lg" />,
                subTitle: `Primal Wallet`,
                onPress: () => {
                    Linking.openURL('nostrnwc+primal://connect?appicon=https%3A%2F%2Folas.app%2Flogo.png&appname=Olas&callback=olas%3A%2F%2Fdlnwc');
                },
            });
        }

        return options;
    }, [searchText, !!primalSupported, !!nip60Wallet]);

    function save() {
        SecureStore.setItemAsync('relays', relays.map((r) => r.url).join(','));
        router.back();
    }

    async function newWallet() {
        const wallet = await createNip60Wallet(ndk);
        setActiveWallet(wallet);
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
            titleClassName={cn("text-lg", info.item.titleClassName)}
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
