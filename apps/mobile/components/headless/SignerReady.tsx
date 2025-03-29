import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { useEffect, useState } from 'react';

import { useNip60WalletStore, useNutzapMonitor, useWalletMonitor } from '@/hooks/wallet';

export default function SignerReady() {
    const { ndk } = useNDK();
    const [signerReady, setSignerReady] = useState(!!ndk?.signer);

    useEffect(() => {
        if (signerReady || !ndk) return;
        ndk.once('signer:ready', () => {
            setSignerReady(true);
        });
    }, [ndk, signerReady])

    if (!signerReady) return null;
    
    return <SignerIsReady />;
}

function SignerIsReady() {
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const initNip60Wallet = useNip60WalletStore((state) => state.init);

    useWalletMonitor(ndk, currentUser?.pubkey);

    console.log('SignerReady');
    
    useEffect(() => {
        console.log('SignerReady useEffect', currentUser?.pubkey);
        if (currentUser?.pubkey) {
            initNip60Wallet(ndk, currentUser?.pubkey);
        }
    }, [ndk, currentUser?.pubkey]);

    useNutzapMonitor(ndk, currentUser?.pubkey);

    return null;
}