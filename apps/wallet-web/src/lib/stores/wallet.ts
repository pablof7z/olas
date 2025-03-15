import { writable } from 'svelte/store';
import type { NDKCashuWallet, NDKNutzapMonitor } from '@nostr-dev-kit/ndk-wallet';

export const wallet = writable<NDKCashuWallet | null>(null);
export const balance = writable<number>(0);
export const isWalletLoading = writable<boolean>(false);
export const nutzapMonitor = writable<NDKNutzapMonitor | null>(null); 