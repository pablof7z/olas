import { DBCache, NDKEvent, NDKKind, NDKNutzap, useNDKCurrentUser, useNDK, useSubscribe, useNDKWallet } from "@nostr-dev-kit/ndk-mobile";
import { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { Text } from "@/components/nativewindui/Text";
import { useState } from "react";
import { formatMoney } from "@/utils/bitcoin";
import { Button } from "@/components/nativewindui/Button";
import { Proof } from "@cashu/cashu-ts";

export default function NutzapsScreen() {
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const { events: nutzaps } = useSubscribe(currentUser?.pubkey ? [{
        '#p': [currentUser?.pubkey],
        kinds: [NDKKind.Nutzap]
    }] : false, { closeOnEose: true }, [currentUser?.pubkey])
    const [dbNutzaps, setDbNutzaps] = useState(DBCache.wallet.nutzaps.getNutzaps(ndk));
    const { activeWallet } = useNDKWallet();

    const { events: walletTxEvents } = useSubscribe(currentUser?.pubkey ? [{
        authors: [currentUser?.pubkey],
        kinds: [NDKKind.WalletChange]
    }] : false, { groupable: false, closeOnEose: true }, [currentUser?.pubkey])

    const redeemedNutzaps = useMemo(() => {
        const ids = new Set<string>();
        walletTxEvents.map((tx) => tx.getMatchingTags("e", "redeemed").forEach((tag) => ids.add(tag[1])));
        console.log('ids', ids.size);
        return ids;
    }, [walletTxEvents])

    if (!(activeWallet instanceof NDKCashuWallet)) return null;

    const keys = new Set(activeWallet.p2pks);

    return <View style={{ flex: 1 } }>
        <FlashList
            data={nutzaps}
            renderItem={({item}) => <NutzapRow p2pks={keys} event={item} dbNutzaps={dbNutzaps} redeemedNutzaps={redeemedNutzaps} />}
        />
    </View>
}   

function NutzapRow({ wallet, p2pks, event, dbNutzaps, redeemedNutzaps }: { wallet: NDKCashuWallet, p2pks: Set<string>, event: NDKEvent, dbNutzaps: DBCache.wallet.nutzaps.NDKNutzapDB[], redeemedNutzaps: Set<string> }) {
    const nutzap = NDKNutzap.from(event);
    const status = useMemo(() => {
        if (!nutzap) return null;
        const dbNutzap = dbNutzaps.find((n) => n.event_id === nutzap.id);
        return dbNutzap?.status;
    }, [dbNutzaps, nutzap?.id])

    const onRedeemed = useCallback((res: Proof[]) => {
        alert('redeemed')
    }, [])

    const claim = useCallback(async () => {
        if (!nutzap) return;
        console.log('claiming', nutzap?.id)
        const res = await wallet.redeemNutzap(nutzap, { onRedeemed });
        console.log('res', res);
    }, [wallet?.walletId, nutzap?.id])
    
    if (!nutzap) return null;
    
    return <View>
        <Text>amount = {formatMoney({ amount: nutzap.amount, unit: nutzap.unit })}</Text>
        {!p2pks.has(nutzap.p2pk) && <Text>invalid p2pk {nutzap.p2pk}</Text>}
        <Text>status = {status}</Text>
        <Text>{redeemedNutzaps.has(nutzap.id) && 'redeemed'}</Text>
        <Button variant="primary" onPress={claim}>
            <Text>Claim</Text>
        </Button>
    </View>
}