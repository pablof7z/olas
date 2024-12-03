import { NDKEvent, NDKKind, useNDK, useNDKSession, useNDKSessionEvents } from '@nostr-dev-kit/ndk-mobile';
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
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';

export default function WalletsScreen() {
    const { ndk } = useNDK();
    const { activeWallet, setActiveWallet } = useNDKSession();
    const allWallets = useNDKSessionEvents([NDKKind.CashuWallet]);
    const [searchText, setSearchText] = useState<string | null>(null);
    const [relays, setRelays] = useState<NDKRelay[]>(Array.from(ndk!.pool.relays.values()));
    const [url, setUrl] = useState('');

    const data = useMemo(() => {
        if (!ndk) return [];

        const options = Array.from(allWallets.values())
            .map((walletEvent: NDKEvent) => ({
                id: walletEvent.id,
                title: walletEvent.dTag,
                subTitle: walletEvent.getMatchingTags('mint').length + ' mint(s)',
                rightView: (
                    <View className="flex-1 items-center px-2">
                        <Button variant="secondary" size="sm" onPress={() => NDKCashuWallet.from(walletEvent).then(setActiveWallet)}>
                            <Text>Use</Text>
                        </Button>
                    </View>
                ),
            }))
            .filter((item) => (searchText ?? '').trim().length === 0 || item.title.match(searchText!));
        
        options.push('gap 1');

        options.push({
            id: 'nwc',
            title: 'Nostr Wallet Connect',
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

    return (
        <>
            <LargeTitleHeader
                title={`Wallets (${data?.length})`}
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
                sectionHeaderAsGap
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
