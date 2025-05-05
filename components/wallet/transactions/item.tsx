import {
    NDKCashuWalletTx,
    NDKEvent,
    NDKKind,
    NDKNutzap,
    type NDKPaymentConfirmation,
    type NDKZapSplit,
    useNDK,
    useProfileValue,
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
    const userProfile = useProfileValue(pubkey, { subOpts: { skipVerification: true } });
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

    // Fix callback signature for zapper.once
    item.zapper.once(
        'split:complete',
        (_split: NDKZapSplit, info: Error | NDKPaymentConfirmation | undefined) => {
            if (info instanceof Error) {
                setError(info);
            } else if (info) {
                // Handle successful confirmation if needed
            } else {
                // Handle undefined case if needed
            }
        }
    );

    const targetPubkey = useMemo(() => item.zapper.target?.pubkey, [item.internalId]);

    return (
        <ListItem
            className={cn(
                'ios:pl-0 !bg-transparent pl-2',
                index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
            )}
            target={target}
            item={{
                title: '', // Removed id, title handled by children
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
    // Convert undefined from cache to null for useState
    const [nutzap, setNutzap] = useState<NDKNutzap | null>(nutzapItemCache.get(item.id) ?? null);
    const id = item.tagId();
    const [walletChange, setWalletChange] = useState<NDKCashuWalletTx | null>(
        // Convert undefined from cache to null for useState
        historyItemCache.get(id) ?? null
    );

    useEffect(() => {
        if (!walletChange && item.content.length > 0) {
            NDKCashuWalletTx.from(item)
                .then((walletChange) => {
                    // Check if walletChange is defined before accessing id
                    if (walletChange && item.id === walletChange.id) {
                        // Convert undefined to null for setWalletChange
                        setWalletChange(walletChange ?? null);
                    }
                    // Check if walletChange is defined before setting cache
                    if (walletChange) {
                        historyItemCache.set(walletChange.tagId(), walletChange);
                    }
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
            // Ensure ndk, eTag, and walletChange (as NDKEvent) are valid before fetching
            if (ndk && eTag && walletChange) {
                ndk.fetchEventFromTag(eTag, walletChange).then((event) => {
                    if (event && isValid) {
                        const fetchedNutzap = NDKNutzap.from(event);
                        // Convert undefined to null for setNutzap
                        setNutzap(fetchedNutzap ?? null);
                        // Only set cache if nutzap is valid
                        if (fetchedNutzap) {
                            nutzapItemCache.set(item.id, fetchedNutzap);
                        }
                    }
                });
            }
        }

        return () => {
            isValid = false;
            nutzapFetched = false;
        };
    }, [eTag, ndk]);

    const handleLongPress = () => {};

    if (!walletChange) return <></>;
    // Ensure walletChange is valid before proceeding
    if (!walletChange) {
        console.error('Missing walletChange data for item:', item.id);
        // Return a minimal representation or null if walletChange is missing
        return <ListItem index={index} target={target} item={{ title: 'Loading...' }} />;
    }

    // Ensure amount is valid
    if (typeof walletChange.amount !== 'number' || walletChange.amount < 0) {
        console.error(
            'Invalid amount in walletChange data for item:',
            item.id,
            typeof walletChange.amount
        );
        return <ListItem index={index} target={target} item={{ title: 'Invalid Amount' }} />;
    }

    return (
        <Animated.View entering={SlideInDown}>
            <ListItem
                className={cn(
                    '!bg-transparent px-2',
                    index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t'
                )}
                target={target}
                leftView={
                    // Conditionally render LeftView based on valid direction
                    walletChange.direction === 'in' || walletChange.direction === 'out' ? (
                        <LeftView
                            direction={walletChange.direction}
                            pubkey={nutzapCounterparts?.[0]}
                        />
                    ) : null // Render nothing if direction is invalid
                }
                item={{
                    // id: item.id, // Removed as it's not a valid prop for the item object structure
                    // Provide default title if condition is false
                    title:
                        nutzapCounterparts && nutzapCounterparts.length > 1
                            ? `${nutzapCounterparts.length} zappers`
                            : '', // Use empty string as default title
                }}
                titleClassName="font-bold"
                rightView={
                    <ItemRightColumn
                        mint={walletChange.mint}
                        // Pass validated amount and unit (defaulting if necessary)
                        amount={walletChange.amount} // Already validated above
                        unit={walletChange.unit ?? 'sat'} // Default unit if undefined
                        isPending={false}
                    />
                }
                index={index}
                onPress={onPress}
                onLongPress={handleLongPress}
            >
                {/* Children passed to ListItem */}
                {nutzapCounterparts && nutzapCounterparts.length === 1 && nutzapCounterparts[0] ? (
                    // Case 1: Single valid counterparty
                    <Counterparty pubkey={nutzapCounterparts[0]} timestamp={item.created_at}>
                        <Text
                            className="text-sm text-muted-foreground"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {walletChange?.description}
                        </Text>
                    </Counterparty>
                ) : nutzapCounterparts && nutzapCounterparts.length > 1 ? (
                    // Case 2: Multiple counterparties (title already shows count)
                    <Text
                        className="text-sm text-muted-foreground"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {walletChange?.description}
                    </Text>
                ) : (
                    // Case 3: No counterparties or invalid data (render description directly)
                    <Text
                        className="text-sm text-muted-foreground"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {walletChange?.description ?? 'Transaction'}
                    </Text>
                )}
            </ListItem>
        </Animated.View>
    );
}
