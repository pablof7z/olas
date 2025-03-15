import { NDKCashuWallet, NDKNutzapMonitor } from '@nostr-dev-kit/ndk-wallet';
import type NDK from "@nostr-dev-kit/ndk-svelte/svelte5";
import { NDKCashuMintList, NDKKind } from '@nostr-dev-kit/ndk';
import { wallet, balance, isWalletLoading, nutzapMonitor } from '../stores/wallet';

/**
 * Initializes the NIP-60 wallet for the user
 * @param ndk NDK instance
 * @returns The initialized wallet instance
 */
export async function initializeWallet(ndk: NDK) {
    isWalletLoading.set(true);

    try {
        // Try to find existing wallet for this user
        const existingWalletEvent = await ndk.fetchEvent({ 
            kinds: [NDKKind.CashuWallet], 
            authors: [ndk.activeUser?.pubkey!] 
        });

        console.log('existingWalletEvent', existingWalletEvent);
        
        let walletInstance = existingWalletEvent 
            ? await NDKCashuWallet.from(existingWalletEvent)
            : null;
        
        // Create new wallet if none exists
        if (!walletInstance) {
            console.log('Creating new wallet');
            walletInstance = new NDKCashuWallet(ndk);
            walletInstance.mints = [
                'https://mint.coinos.io', 
                'https://stablenut.umint.cash',
                'https://mint.minibits.cash/Bitcoin'
            ];
            await walletInstance.getP2pk();
            await walletInstance.publish();
            walletInstance.backup();
        }
        
        // Start wallet monitoring
            walletInstance.start({ subId: 'wallet' });
            console.log('starting wallet instance')
        
        // Update stores
        wallet.set(walletInstance);
        updateBalance(walletInstance);
        
        // Subscribe to balance changes using proper event typing
        walletInstance.on('balance_updated', () => updateBalance(walletInstance));
        walletInstance.on('balance_updated', () => console.log('balance_updated'));
        ndk.wallet = walletInstance;
        
        // Initialize and start nutzap monitor
        await initializeNutzapMonitor(ndk, walletInstance);
        
        return walletInstance;
    } catch (error) {
        console.error('Wallet initialization failed:', error);
        throw error;
    } finally {
        isWalletLoading.set(false);
    }
}

/**
 * Updates the balance store with the current wallet balance
 */
function updateBalance(walletInstance: NDKCashuWallet) {
    // Ensure balance is a number
    const walletBalance = walletInstance.balance?.amount ?? 0;
    balance.set(walletBalance);
}

/**
 * Initializes the nutzap monitor
 * @param ndk NDK instance
 * @param walletInstance Cashu wallet instance
 */
async function initializeNutzapMonitor(ndk: NDK, walletInstance: NDKCashuWallet) {
    try {
        if (!ndk.activeUser) {
            console.error('Cannot initialize nutzap monitor: No active user');
            return;
        }
        
        // Create a mint list for the monitor (optional but recommended)
        const mintList = new NDKCashuMintList(ndk);
        mintList.mints = walletInstance.mints;
        mintList.p2pk = walletInstance.p2pk;
        await mintList.publishReplaceable();
        
        // Create the nutzap monitor
        const monitor = new NDKNutzapMonitor(
            ndk,
            ndk.activeUser,
            { mintList }
        );
        
        // Set the wallet for the monitor
        monitor.wallet = walletInstance;
        
        // Set up event handlers
        monitor.on('seen', (nutzap) => {
            console.log('Seen a new nutzap:', nutzap.id);
        });
        
        monitor.on('redeemed', (events, amount) => {
            console.log(`Redeemed ${events.length} nutzap(s) for ${amount} sats`);
            // Update balance after redeeming nutzaps
            updateBalance(walletInstance);
        });
        
        monitor.on('failed', (nutzap, error) => {
            console.error(`Failed to redeem nutzap ${nutzap.id}: ${error}`);
        });
        
        // Start monitoring for nutzaps
        await monitor.start({
            filter: { limit: 50 },
            opts: { skipVerification: true }
        });
        
        // Update store
        nutzapMonitor.set(monitor);
        
        console.log('Nutzap monitor initialized and started');
    } catch (error) {
        console.error('Failed to initialize nutzap monitor:', error);
    }
} 