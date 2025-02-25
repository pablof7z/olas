import { toast } from "@backpackapp-io/react-native-toast";
import { useNDKNutzapMonitor, useNDKCurrentUser, useNDK, NDKKind, useNDKWallet, useNDKSessionEventKind, NDKCashuMintList } from "@nostr-dev-kit/ndk-mobile";
import { useState, useEffect } from "react";
import { migrateCashuWallet, NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useNip60Wallet } from "@/hooks/wallet";

export default function NutzapMonitor() {
    const [start, setStart] = useState(false);
    console.log('nutzap start', start);
    const { activeWallet } = useNDKWallet();
    const mintList = useNDKSessionEventKind<NDKCashuMintList>(NDKKind.CashuMintList);
    const { nutzapMonitor } = useNDKNutzapMonitor(mintList, start);
    const currentUser = useNDKCurrentUser();
    const {ndk} = useNDK();
    const [hasOldWallets, setHasOldWallets] = useState<boolean | null>(null);
    const cashuWallet = useNip60Wallet();

    console.log('nutzapMonitor', !!nutzapMonitor, { haveCashuWallet: !!cashuWallet, activeWallet: activeWallet?.walletId });

    useEffect(() => {
        if (!cashuWallet || !nutzapMonitor) return;
        if (activeWallet instanceof NDKCashuWallet) return;

        for (const signer of cashuWallet.privkeys.values()) {
            nutzapMonitor.addPrivkey(signer);
        }
    }, [cashuWallet, nutzapMonitor, activeWallet])

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
        console.log('activeWallet', activeWallet?.walletId);
        if (!activeWallet?.walletId) return;
        console.log('starting monitor');

        setTimeout(() => {
            console.log('setting start to true');
            setStart(true)
        }, 2000);
    }, [currentUser?.pubkey, start, hasOldWallets, activeWallet?.walletId])
    
    if (!nutzapMonitor) return null;
}
