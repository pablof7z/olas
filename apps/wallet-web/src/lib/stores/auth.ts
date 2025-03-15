import { writable } from 'svelte/store';
import NDK from "@nostr-dev-kit/ndk-svelte/svelte5";
import type { NDKUser } from '@nostr-dev-kit/ndk';

export const currentUser = writable<NDKUser | null>(null);
export const isAuthenticated = writable<boolean>(false);
export const ndkInstance = writable<NDK | null>(null); 