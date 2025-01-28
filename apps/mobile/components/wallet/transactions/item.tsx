import { cn } from "@/lib/cn";
import { useAppStateStore, ZapperWithId } from "../store";
import { nicelyFormattedMintName } from "@/utils/mint";
import { Button } from "@/components/nativewindui/Button";
import { formatMoney } from "@/utils/bitcoin";
import { NDKEvent, useNDK, NDKNutzap, useUserProfile, NDKZapSplit, NDKPaymentConfirmation, NDKKind } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuDeposit, NDKWallet, NDKWalletChange } from "@nostr-dev-kit/ndk-wallet";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { View } from "react-native";
import { ListItem } from "@/components/nativewindui/List";
import { Text } from "@/components/nativewindui/Text";
import { ArrowUp, ArrowDown, Timer } from "lucide-react-native";
import { useColorScheme } from "@/lib/useColorScheme";
import * as User from "@/components/ui/user";
import RelativeTime from "@/app/components/relative-time";

const LeftView = ({ direction, pubkey }: { direction: 'in' | 'out', pubkey?: string }) => {
    const { userProfile } = useUserProfile(pubkey);
    const { colors } = useColorScheme();

    const color = colors.primary;

    if (pubkey && userProfile) {
        return (
            <View className="flex-row items-center gap-2 relative" style={{ marginRight: 10}}>
                {userProfile && <User.Avatar pubkey={pubkey} userProfile={userProfile} imageSize={24} />}
                {direction === 'out' && (
                    <View className="absolute -right-2 -top-2 rotate-45">
                        <ArrowUp size={18} color={color} />
                    </View>
                )}
                {direction === 'in' && (
                    <View className="absolute -right-2 -bottom-2 -rotate-45">
                        <ArrowDown size={18} color={color} />
                    </View>
                )}
            </View>
        )
    }
    
    return (
        <View className="flex-row items-center gap-2 mr-2">
            {direction === 'out' ? <ArrowUp size={24} color={color} /> : <ArrowDown size={24} color={color} />}
        </View>
    )
}

const Zapper = ({ pubkey, timestamp }: { pubkey: string, timestamp: number }) => {
    const { userProfile } = useUserProfile(pubkey);
    return (
        <View className="flex-col gap-0">
            <Text numberOfLines={1} ellipsizeMode="tail" className="text-lg font-medium text-foreground">{userProfile?.name || userProfile?.displayName}</Text>
            <RelativeTime className="text-xs text-muted-foreground" timestamp={timestamp} />
            {/* <Text className="text-xs text-muted-foreground">Nutzap</Text> */}
        </View>
    )
}

export default function HistoryItem({ wallet, item, index, target, onPress }: {
    wallet: NDKWallet, item: NDKEvent | NDKCashuDeposit | ZapperWithId,
    index: number,
    target: any,
    onPress: () => void
}) {
    if (item instanceof NDKCashuDeposit) {
        return <HistoryItemCashuQuote item={item} index={index} target={target} onPress={onPress} />
    } else if (item instanceof NDKEvent) {
        return <HistoryItemEvent wallet={wallet} item={item} index={index} target={target} onPress={onPress} />
    } else {
        return <HistoryItemPendingZap item={item} index={index} target={target} />
    }
}


function HistoryItemPendingZap({ item, index, target }: { item: ZapperWithId, index: number, target: any }) {
    const [ state, setState ] = useState<'pending' | 'sending' | 'complete' | 'failed'>('sending');
    const timer = useRef<NodeJS.Timeout | null>(null);
    const [ error, setError ] = useState<Error | null>(null);
    const { pendingPayments, removePendingPayment } = useAppStateStore();

    const { amount } = item.zapper;

    const onPress = () => {
        if (state === 'failed') {
            // remove it from the store
            removePendingPayment(item.internalId);
        }
    }

    if (!timer.current) {
        timer.current = setTimeout(() => {
            onPress();
        }, 2000);
    }

    item.zapper.once('split:complete', (split: NDKZapSplit, result: NDKPaymentConfirmation) => {
        console.log('received a split:complete event', {
            temporaryId: item.internalId,
            result
        })
        if (result instanceof Error) {
            setError(result);
        }
    });

    const targetPubkey = useMemo(() => item.zapper.target?.pubkey, [item.internalId]);

    return (
        <ListItem
            className={cn('ios:pl-0 pl-2', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
            target={target}
            leftView={<LeftView direction="out" pubkey={targetPubkey} />}
            rightView={(
                <View className="flex-col items-end gap-0">
                    <Text className="text-lg font-bold text-foreground">{formatMoney({ amount, unit: item.zapper.unit })}</Text>
                    <Text className="text-sm text-muted-foreground">{state}</Text>
                </View>
            )}
            index={index}
            onPress={onPress}
        >
            <Zapper pubkey={item.zapper.target?.pubkey} timestamp={item.zapper.created_at} />
            {/* <Text className="text-xs text-muted-foreground">{item.id}</Text> */}
            {error && <Text className="text-xs text-red-500">{error.message}</Text>}
        </ListItem>  
    )
}

function HistoryItemCashuQuote({ item, index, target, onPress }: { item: NDKCashuDeposit, index: number, target: any, onPress: () => void }) {
    const { colors } = useColorScheme();

    const check = async () => {
        const res =await item.check();
        console.log('check', res);
    }

    return (
        <ListItem
            className={cn('ios:pl-0 pl-2 !bg-transparent', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
            target={target}
            leftView={<Timer size={24} color={colors.foreground} />}
            rightView={<Button variant="plain" size="sm" onPress={check}>
                <Text>Check</Text>
            </Button>}
            item={{
                id: item.quoteId,
                title: 'Cashu Deposit',
                subTitle: 'Waiting for confirmation'
            }}
            index={index}
            onPress={onPress}
        >
        </ListItem>  
    )
}

const historyItemCache = new Map<string, NDKWalletChange>();
const nutzapItemCache = new Map<string, NDKNutzap>();

function HistoryItemEvent({ wallet, item, index, target, onPress }: { wallet: NDKWallet, item: NDKEvent, index: number, target: any, onPress: () => void }) {
    const { ndk } = useNDK();
    const [ nutzap, setNutzap ] = useState<NDKNutzap | null>(nutzapItemCache.get(item.id));
    const id = item.tagId();
    const [ walletChange, setWalletChange ] = useState<NDKWalletChange | null>(historyItemCache.get(id));

    useEffect(() => {
        if (!walletChange && item.content.length > 0) {
            NDKWalletChange.from(item).then((walletChange) => {
                if (item.id === walletChange.id) {
                    setWalletChange(walletChange);
                }
                historyItemCache.set(walletChange.tagId(), walletChange);
            }).catch((e) => {
                console.error('error converting item id', item.id, 'to walletChange id', e);
                console.log(item.rawEvent());
            });
        }
    }, [item.id, setWalletChange]);

    const eTag = useMemo(() => walletChange?.getMatchingTags('e', 'redeemed')[0], [walletChange?.id]);

    const nutzapCounterpart = useMemo(() => {
        if (!walletChange) return null;
        if (walletChange.direction === 'out') {
            return walletChange.tagValue('p');
        } else if (walletChange.direction === 'in') {
            const eTag = walletChange.getMatchingTags('e', 'redeemed')[0];
            return eTag ? (nutzap?.pubkey ?? eTag[4]) : null;
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
        }
    }, [eTag, ndk]);

    if (!walletChange) return <></>
    if (walletChange.amount < 0) return <Text>invalid item {item.id}</Text>;

    return (
        <ListItem
            className={cn('px-2 !bg-transparent', index === 0 && 'ios:border-t-0 border-border/25 dark:border-border/80 border-t')}
            target={target}
            leftView={<LeftView direction={walletChange.direction} pubkey={nutzapCounterpart} />}
            item={{
                id: item.id,
                title: nutzapCounterpart ? null : walletChange.description,
                subTitle: nutzapCounterpart ? null : nicelyFormattedMintName(walletChange.mint)
            }}
            rightView={<RightView amount={walletChange.amount} unit={walletChange.unit ?? wallet.unit ?? "sat"} createdAt={item.created_at} />}
            index={index}
            onPress={onPress}
        >
            {nutzapCounterpart && ( <Zapper pubkey={nutzapCounterpart} timestamp={item.created_at} /> )}
            {/* <Text className="text-xs text-muted-foreground">{nutzapCounterpart?.substring(0, 6)}</Text>
            <Text className="text-xs text-muted-foreground">{id?.substring(0, 6)}</Text>
            <Text className="text-xs text-muted-foreground">{walletChange.id?.substring(0, 6)}</Text> */}
        </ListItem>  
    )
}

function RightView({ amount, unit, createdAt }: { amount: number, unit: string, createdAt: number }) {
    if (!amount) return null;

    const niceAmount = formatMoney({ amount, unit, hideUnit: true });
    const niceUnit = formatMoney({ amount, unit, hideAmount: true });

    return (
        <View className="flex-col items-end -gap-1">
            <Text className="text-lg font-bold text-foreground font-mono">{niceAmount}</Text>
            <Text className="text-sm text-muted-foreground">{niceUnit}</Text>
        </View>
    )
}