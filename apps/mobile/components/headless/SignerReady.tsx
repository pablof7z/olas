import { useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-mobile";
import { useEffect, useState } from "react";

import { useNip60WalletStore, useNutzapMonitor, useWalletMonitor } from "@/hooks/wallet";

export default function SignerReady() {
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const [signerReady, setSignerReady] = useState(!!ndk?.signer && !!currentUser?.pubkey);

    useEffect(() => {
        if (signerReady || !ndk) return;
        ndk.once("signer:ready", () => {
            setSignerReady(true);
        });
    }, [ndk, signerReady, currentUser]);

    if (!signerReady || !currentUser) return null;

    return <SignerIsReady />;
}

function SignerIsReady() {
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const initNip60Wallet = useNip60WalletStore.getState().init;

    useWalletMonitor(currentUser?.pubkey);

    useEffect(() => {
        if (!ndk || !currentUser?.pubkey) return;

        initNip60Wallet(ndk, currentUser?.pubkey);
    }, [ndk, currentUser?.pubkey]);

    useNutzapMonitor(ndk!, currentUser!.pubkey);

    return null;
}
