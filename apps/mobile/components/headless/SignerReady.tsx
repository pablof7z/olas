import { useNutzapMonitor, useNip60WalletStore } from '@/hooks/wallet';
import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { useEffect } from 'react';

let renderCount = 0;

export default function SignerReady() {
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const initNip60Wallet = useNip60WalletStore((state) => state.init);

    useEffect(() => {
        initNip60Wallet(ndk, currentUser?.pubkey);
    }, [ndk, currentUser?.pubkey]);

    console.log('<SignerReady> rendering', renderCount++);

    useNutzapMonitor(ndk, currentUser?.pubkey);

    return null;
}
