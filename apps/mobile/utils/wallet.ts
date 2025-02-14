import NDK, { NDKCashuMintList } from "@nostr-dev-kit/ndk-mobile";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";

export function humanWalletType(type: string) {
    if (type === 'nip-60') return 'Nostr-Native Wallet';
    if (type === 'nwc') return 'Nostr Wallet Connect';
    return type;
}

export async function createNip60Wallet(ndk: NDK) {
    const wallet = new NDKCashuWallet(ndk);
    wallet.mints = ['https://mint.coinos.io', 'https://stablenut.umint.cash', 'https://mint.minibits.cash/Bitcoin'];
    await wallet.getP2pk();
    await wallet.publish();
    const mintList = new NDKCashuMintList(ndk);
    mintList.mints = wallet.mints;
    mintList.p2pk = wallet.p2pk;
    mintList.publishReplaceable();
    return wallet;
}