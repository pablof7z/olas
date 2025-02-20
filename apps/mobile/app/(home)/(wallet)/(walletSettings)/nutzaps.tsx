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


    if (!(activeWallet instanceof NDKCashuWallet)) return null;

    const keys = new Set(activeWallet.p2pks);

    return <View style={{ flex: 1 } }>
        <FlashList
            data={nutzaps}
            renderItem={({item}) => <NutzapRow wallet={activeWallet} p2pks={keys} event={item} dbNutzaps={dbNutzaps} />}
        />
    </View>
}   

function NutzapRow({ wallet, p2pks, event, dbNutzaps }: { wallet: NDKCashuWallet, p2pks: Set<string>, event: NDKEvent, dbNutzaps: DBCache.wallet.nutzaps.NDKNutzapDB[] }) {
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
        const res = await wallet.redeemNutzap(nutzap, { onRedeemed });
        console.log('res', res);
    }, [wallet?.walletId, nutzap?.id])
    
    if (!nutzap) return null;

    const spent = ["redeemed", "spent"].includes(status);
    
    return <View className="flex-row items-center gap-2 justify-between">
        <Text>{formatMoney({ amount: nutzap.amount, unit: nutzap.unit })}</Text>
        {!spent && !p2pks.has(nutzap.p2pk) && <Text>invalid p2pk {nutzap.p2pk.substring(0, 6)}...</Text>}
        <Text>{status}</Text>
        <Button size="sm" variant={!spent ? "primary" : "plain" } onPress={claim}>
            <Text>{spent ? 'Claimed' : 'Claim'}</Text>
        </Button>
    </View>
}