import { toast } from "@backpackapp-io/react-native-toast";
import { useNDKNutzapMonitor, useNDKCurrentUser, NDKNutzap, useNDK, NDKKind } from "@nostr-dev-kit/ndk-mobile";
import { migrateCashuWallet } from "@nostr-dev-kit/ndk-wallet";
import { useState, useRef, useEffect, useCallback } from "react";

export default function NutzapMonitor() {
    const [start, setStart] = useState(false);
    const { nutzapMonitor } = useNDKNutzapMonitor(start);
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

        setTimeout(() => setStart(true), 1000);
    }, [currentUser?.pubkey, start, hasOldWallets])
    
    if (!nutzapMonitor) return null;

    // nutzapMonitor.on("seen", (event) => {
    //     console.log("seen", JSON.stringify(event.rawEvent(), null, 4));
    //     console.log(`https://njump.me/${event.encode()}`)
    //     // toast.success("Received a nutzap for " + event.amount + " " + event.unit);
    // });
}
