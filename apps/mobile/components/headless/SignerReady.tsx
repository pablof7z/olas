import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-mobile';
import { useEffect } from 'react';

import { useNip60WalletStore, useNutzapMonitor } from '@/hooks/wallet';

const _renderCount = 0;

export default function SignerReady() {
    const { ndk } = useNDK();
    const currentUser = useNDKCurrentUser();
    const initNip60Wallet = useNip60WalletStore((state) => state.init);

    useEffect(() => {
        initNip60Wallet(ndk, currentUser?.pubkey);
    }, [ndk, currentUser?.pubkey]);

    useNutzapMonitor(ndk, currentUser?.pubkey);

    return null;
}
