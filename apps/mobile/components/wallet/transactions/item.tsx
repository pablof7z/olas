import {
    NDKCashuWalletTx,
    NDKEvent,
    NDKKind,
    NDKNutzap,
    type NDKPaymentConfirmation,
    type NDKZapSplit,
    useNDK,
    useUserProfile,
} from '@nostr-dev-kit/ndk-mobile';
import { NDKCashuDeposit, type NDKWallet } from '@nostr-dev-kit/ndk-wallet';
import { ArrowDown, ArrowUp, Timer } from 'lucide-react-native';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { Counterparty } from './counterparty';
import { ItemRightColumn } from './item-right-column';

import { Button } from '@/components/nativewindui/Button';
import { ListItem } from '@/components/nativewindui/List';
import { Text } from '@/components/nativewindui/Text';
import * as User from '@/components/ui/user';
import { cn } from '@/lib/cn';
import { useColorScheme } from '@/lib/useColorScheme';
import type { PendingZap } from '@/stores/payments';

const LeftView = ({ direction, pubkey }: { direction: 'in' | 'out'; pubkey?: string }) => {
    const { userProfile } = useUserProfile(pubkey);
    const { colors } = useColorScheme();

    const color = colors.primary;

    if (pubkey && userProfile) {
        return (
            <View className="relative flex-row items-center gap-2" style={{ marginRight: 10 }}>
                {userProfile && (
                    <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={48} />
                )}
                {direction === 'out' && (
                    <View className="absolute -right-2 -top-2 rotate-45">
                        <ArrowUp size={18} color={color} />
                    </View>
                )}
                {direction === 'in' && (
                    <View className="absolute -bottom-2 -right-2 -rotate-45">
                        <ArrowDown size={18} color={color} />
                    </View>
                )}
            </View>
        );
    }

    return (
        <View className="mr-2 flex-row items-center gap-2">
            {direction === 'out' ? (
                <ArrowUp size={24} color={color} />
            ) : (
                <ArrowDown size={24} color={color} />
            )}
        </View>
    );
};

export default function HistoryItem({
    wallet,
    item,
    index,
    target,
    onPress,
}: {
    wallet: NDKWallet;
    item: NDKEvent | NDKCashuDeposit | PendingZap;
    index: number;
    target: any;
    onPress: () => void;
}) {
    if (item instanceof NDKCashuDeposit) {
        return (
            <HistoryItemCashuQuote item={item} index={index} target={target} onPress={onPress} />
        );
    } else if (item instanceof NDKEvent) {
        return (
            <HistoryItemEvent
                wallet={wallet}
                item={item}
                index={index}
                target={target}
                onPress={onPress}
            />
        );
    } else {
        return <HistoryItemPendingZap item={item} index={index} target={target} />;
    }
}

function HistoryItemPendingZap({
    item,
    index,
    target,
}: { item: PendingZap; index: number; target: any }) {
    const [state, _setState] = useState<'pending' | 'sending' | 'complete' | 'failed'>('sending');
    const timer = useRef<NodeJS.Timeout | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const { amount } = item.zapper;

    const onPress = () => {
        if (state === 'failed') {
            // remove it from the store
        }
    };

    if (!timer.current) {
        timer.current = setTimeout(() => {
            onPress();
        }, 2000);
    }

    item.zapper.once('split:complete', (_split: NDKZapSplit, result: NDKPaymentConfirmation) => {
        if (result instanceof Error) {
            setError(result);
        }
    });

    const targetPubkey = useMemo(() => item.zapper.target?.pubkey, [item.internalId]);

    return (
        <ListItem
            className={cn(
                'ios:pl-0 !bg-transparent pl-2',
                index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
            )}
            target={target}
            item={{
                id: item.internalId,
            }}
            leftView={<LeftView direction="out" pubkey={targetPubkey} />}
            rightView={<ItemRightColumn isPending amount={amount} unit={item.zapper.unit} />}
            index={index}
            onPress={onPress}
        >
            <Counterparty pubkey={item.zapper.target?.pubkey} />
            {/* <Text className="text-xs text-muted-foreground">{item.id}</Text> */}
            {error && <Text className="text-xs text-red-500">{error.message}</Text>}
        </ListItem>
    );
}

function HistoryItemCashuQuote({
    item,
    index,
    target,
    onPress,
}: {
    item: NDKCashuDeposit;
    index: number;
    target: any;
    onPress: () => void;
}) {
    const { colors } = useColorScheme();

    const check = async () => {
        const _res = await item.check();
    };

    return (
        <ListItem
            className={cn(
                'ios:pl-0 !bg-transparent pl-2',
                index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
            )}
            target={target}
            leftView={<Timer size={24} color={colors.foreground} />}
            rightView={
                <Button variant="plain" size="sm" onPress={check}>
                    <Text>Check</Text>
                </Button>
            }
            item={{
                id: item.quoteId,
                title: 'Cashu Deposit',
                subTitle: 'Waiting for confirmation',
            }}
            index={index}
            onPress={onPress}
        />
    );
}

const historyItemCache = new Map<string, NDKCashuWalletTx>();
const nutzapItemCache = new Map<string, NDKNutzap>();

function HistoryItemEvent({
    wallet,
    item,
    index,
    target,
    onPress,
}: {
    wallet: NDKWallet;
    item: NDKEvent;
    index: number;
    target: any;
    onPress: () => void;
}) {
    const { ndk } = useNDK();
    const [nutzap, setNutzap] = useState<NDKNutzap | null>(nutzapItemCache.get(item.id));
    const id = item.tagId();
    const [walletChange, setWalletChange] = useState<NDKCashuWalletTx | null>(
        historyItemCache.get(id)
    );

    useEffect(() => {
        if (!walletChange && item.content.length > 0) {
            NDKCashuWalletTx.from(item)
                .then((walletChange) => {
                    if (item.id === walletChange.id) {
                        setWalletChange(walletChange);
                    }
                    historyItemCache.set(walletChange.tagId(), walletChange);
                })
                .catch((e) => {
                    console.error('error converting item id', item.id, 'to walletChange id', e);
                });
        }
    }, [item.id, setWalletChange]);

    const eTag = useMemo(
        () => walletChange?.getMatchingTags('e', 'redeemed')[0],
        [walletChange?.id]
    );

    const nutzapCounterparts = useMemo(() => {
        if (!walletChange) return null;
        if (walletChange.direction === 'out') {
            return [walletChange.tagValue('p')];
        } else if (walletChange.direction === 'in') {
            const eTags = walletChange.getMatchingTags('e', 'redeemed');
            const pubkeys = eTags.map((eTag) => eTag[4]);

            return pubkeys.length > 0 ? Array.from(new Set(pubkeys)) : null;
        }
    }, [walletChange?.id]);

    useEffect(() => {
        let isValid = true;
        let nutzapFetched = false;

        if (eTag && isValid && ndk && !nutzap && !nutzapFetched) {
            nutzapFetched = true;
            ndk.fetchEventFromTag(eTag, walletChange).then((event) => {
                if (event && isValid) {
                    setNutzap(NDKNutzap.from(event));
                    nutzapItemCache.set(item.id, NDKNutzap.from(event));
                }
            });
        }

        return () => {
            isValid = false;
            nutzapFetched = false;
        };
    }, [eTag, ndk]);

    const handleLongPress = () => {};

    if (!walletChange) return <></>;
    if (walletChange.amount < 0) return <Text>invalid item {item.id}</Text>;

    return (
        <Animated.View entering={SlideInDown}>
            <ListItem
                className={cn(
                    '!bg-transparent px-2',
                    index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                )}
                target={target}
                leftView={
                    <LeftView direction={walletChange.direction} pubkey={nutzapCounterparts?.[0]} />
                }
                item={{
                    id: item.id,
                    title:
                        nutzapCounterparts && nutzapCounterparts.length > 1
                            ? `${nutzapCounterparts.length} zappers`
                            : undefined,
                }}
                titleClassName="font-bold"
                rightView={
                    <ItemRightColumn
                        mint={walletChange.mint}
                        amount={walletChange.amount}
                        unit={walletChange.unit}
                        isPending={false}
                    />
                }
                index={index}
                onPress={onPress}
                onLongPress={handleLongPress}
            >
                {nutzapCounterparts && nutzapCounterparts.length === 1 && (
                    <Counterparty pubkey={nutzapCounterparts[0]} timestamp={item.created_at}>
                        <Text className="text-sm text-muted-foreground">
                            {walletChange.description}
                        </Text>
                    </Counterparty>
                )}
                {nutzapCounterparts && nutzapCounterparts.length > 1 && (
                    <Text className="text-sm text-muted-foreground">
                        {walletChange.description}
                    </Text>
                )}
            </ListItem>
        </Animated.View>
    );
}
