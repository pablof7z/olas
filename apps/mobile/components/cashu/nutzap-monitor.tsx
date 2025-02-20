import { toast } from "@backpackapp-io/react-native-toast";
import { useNDKNutzapMonitor, useNDKCurrentUser, useNDK, NDKKind, useNDKWallet, useNDKSessionEventKind, NDKCashuMintList } from "@nostr-dev-kit/ndk-mobile";
import { migrateCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useState, useEffect } from "react";

export default function NutzapMonitor() {
    const [start, setStart] = useState(false);
    const { activeWallet } = useNDKWallet();
    const mintList = useNDKSessionEventKind<NDKCashuMintList>(NDKKind.CashuMintList);
    const { nutzapMonitor } = useNDKNutzapMonitor(mintList, start);
    const currentUser = useNDKCurrentUser();
    const {ndk} = useNDK();
    const [hasOldWallets, setHasOldWallets] = useState<boolean | null>(null);

    useEffect(() => {
        if (!ndk || !currentUser) return;

        ndk.fetchEvents({ kinds: [NDKKind.LegacyCashuWallet], authors: [currentUser.pubkey]}).then((events) => {
            const nonDeleted = Array.from(events.values()).filter((event) => !event.hasTag('deleted'));
            const hasNonDeleted = nonDeleted.length > 0;
            setHasOldWallets(hasNonDeleted);
            if (hasNonDeleted) {
                toast("Migrating nostr-wallets, this may take some time");
                migrateCashuWallet(ndk).then(() => setHasOldWallets(false));
            }
        });
    }, [!!ndk, currentUser?.pubkey])

    useEffect(() => {
        // don't start until there's a user
        if (!currentUser?.pubkey) return;

        // if we need to do a migration, don't start
        if (hasOldWallets !== false) return;

        // don't start if already started
        if (start) return;

        // don't start if we don't have an active wallet
        if (!activeWallet?.walletId) return;

        setTimeout(() => setStart(true), 2000);
    }, [currentUser?.pubkey, start, hasOldWallets, activeWallet?.walletId])
    
    if (!nutzapMonitor) return null;
}
