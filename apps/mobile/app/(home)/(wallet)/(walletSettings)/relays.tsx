import { NDKCashuMintList, NDKKind, useNDK, useNDKSession, useNDKSessionEventKind, useNDKWallet } from '@nostr-dev-kit/ndk-mobile';
import { Icon } from '@roninoss/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { LargeTitleHeader } from '~/components/nativewindui/LargeTitleHeader';
import { ESTIMATED_ITEM_HEIGHT, List, ListDataItem, ListItem, ListRenderItemInfo, ListSectionHeader } from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { NDKCashuWallet } from '@nostr-dev-kit/ndk-wallet';
import { Button } from '@/components/nativewindui/Button';

export default function WalletRelayScreen() {
    const { ndk } = useNDK();
    const mintList = useNDKSessionEventKind<NDKCashuMintList>(NDKKind.CashuMintList, { create: NDKCashuMintList });
    const { activeWallet } = useNDKWallet();
    const [searchText, setSearchText] = useState<string | null>(null);
    const [relays, setRelays] = useState<string[]>([]);
    const [url, setUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!mintList) return;
        setRelays([...mintList.relays]);
    }, [mintList?.relays?.length]);

    const addFn = () => {
        try {
            const uri = new URL(url);
            if (!['wss:', 'ws:'].includes(uri.protocol)) {
                alert('Invalid protocol');
                return;
            }
            const relay = ndk?.addExplicitRelay(url);
            if (relay) setRelays([...relays, relay.url]);
            setUrl('');
        } catch (e) {
            alert('Invalid URL');
        }
    };

    const removeRelay = useCallback(
        (url: string) => {
            setRelays(relays.filter((r) => r !== url));
        },
        [relays]
    );

    const data = useMemo(() => {
        let r: string[] = relays;

        if (searchText) {
            r = r.filter((relay) => relay.includes(searchText));
        }

        return r
            .map((relay) => ({
                id: relay,
                title: relay,
                rightView: (
                    <View className="flex-1 items-center px-4">
                        <Button variant="secondary" size="sm" onPress={() => removeRelay(relay)}>
                            <Text>Remove</Text>
                        </Button>
                    </View>
                ),
            }))
            .filter((item) => (searchText ?? '').trim().length === 0 || item.title.match(searchText!));
    }, [searchText, relays]);

    const save = useCallback(async () => {
        if (!(activeWallet instanceof NDKCashuWallet)) return;
        setIsSaving(true);
        mintList.relays = relays;
        await activeWallet.getP2pk();
        activeWallet
            .publish()
            .then(() => {
                router.back();
                mintList.mints ??= activeWallet.mints;
                mintList.p2pk = activeWallet.p2pk;
                mintList.publishReplaceable();
            })
            .finally(() => {
                setIsSaving(false);
            });
    }, [relays, activeWallet]);

    return (
        <>
            <LargeTitleHeader
                title="Relays"
                searchBar={{
                    iosHideWhenScrolling: true,
                    onChangeText: setSearchText,
                }}
                rightView={() =>
                    !isSaving ? (
                        <TouchableOpacity onPress={save}>
                            <Text className="text-primary">Save</Text>
                        </TouchableOpacity>
                    ) : (
                        <ActivityIndicator />
                    )
                }
            />
            <List
                contentContainerClassName="pt-4"
                contentInsetAdjustmentBehavior="automatic"
                variant="insets"
                data={[...data, { id: 'add', fn: addFn, set: setUrl }]}
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
                    className="flex-1 text-lg text-foreground placeholder:text-muted-foreground"
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
            onPress={() => console.log('onPress')}
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
