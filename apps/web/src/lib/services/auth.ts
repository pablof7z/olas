import NDK from '@nostr-dev-kit/ndk';
import { NDKNip07Signer, NDKPrivateKeySigner, type NDKUser } from '@nostr-dev-kit/ndk';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import * as nostrTools from 'nostr-tools';
import { setCurrentUser } from '$lib/stores/currentUser.svelte';
import { get } from 'svelte/store';

// Local storage keys
const STORAGE_KEY_NSEC = 'nostr_nsec';
const STORAGE_KEY_LOGIN_METHOD = 'nostr_login_method';

/**
 * Default relays to connect to
 */
const DEFAULT_RELAYS = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band'
];

/**
 * Creates an NDK instance with default relays
 */
export function createNDK(signer?: NDKNip07Signer | NDKPrivateKeySigner) {
    return new NDK({
        explicitRelayUrls: DEFAULT_RELAYS,
        signer
    });
}

/**
 * Attempts to login using a NIP-07 compatible browser extension
 * @returns {Promise<{user: NDKUser, ndk: NDK}>}
 */
export async function loginWithNip07() {
    try {
        if (!browser || !window.nostr) {
            throw new Error('No NIP-07 extension detected');
        }

        const signer = new NDKNip07Signer();
        const ndk = createNDK(signer);
        await ndk.connect();
        const user = await signer.user();
        
        // Save login method to local storage
        localStorage.setItem(STORAGE_KEY_LOGIN_METHOD, 'nip07');
        
        // Update the user store
        setCurrentUser(user);
        
        return { user, ndk };
    } catch (error) {
        console.error('NIP-07 login failed:', error);
        throw error;
    }
}

/**
 * Attempts to login using a private key (nsec)
 * @param nsec The private key in nsec format
 * @returns {Promise<{user: NDKUser, ndk: NDK}>}
 */
export async function loginWithPrivateKey(nsec: string) {
    try {
        // Validate nsec format
        if (!nsec.startsWith('nsec1')) {
            throw new Error('Invalid private key format. Must start with "nsec1"');
        }
        
        const signer = new NDKPrivateKeySigner(nsec);
        const ndk = createNDK(signer);
        await ndk.connect();
        const user = await signer.user();
        
        // Save credentials to local storage
        localStorage.setItem(STORAGE_KEY_NSEC, nsec);
        localStorage.setItem(STORAGE_KEY_LOGIN_METHOD, 'privateKey');
        
        // Update the user store
        setCurrentUser(user);
        
        return { user, ndk };
    } catch (error) {
        console.error('Private key login failed:', error);
        throw error;
    }
}

/**
 * Creates a new account by generating a private key
 * @returns {Promise<{nsec: string, npub: string, user: NDKUser, ndk: NDK}>}
 */
export async function createNewAccount() {
    try {
        // Generate a new private key
        const privateKey = nostrTools.generateSecretKey();
        const publicKey = nostrTools.getPublicKey(privateKey);
        
        // Convert to NIP-19 format
        const nsec = nostrTools.nip19.nsecEncode(privateKey);
        const npub = nostrTools.nip19.npubEncode(publicKey);
        
        // Login with the new private key
        const { user, ndk } = await loginWithPrivateKey(nsec);
        
        return {
            nsec,
            npub,
            user,
            ndk
        };
    } catch (error) {
        console.error('Account creation failed:', error);
        throw error;
    }
}

/**
 * Updates the user's profile name
 * @param name The name to set
 */
export async function updateProfileName(name: string) {
    try {
        const currentUser = get(setCurrentUser);
        if (!currentUser || !currentUser.user) {
            throw new Error('No authenticated user');
        }
        
        // TODO: Implement profile update via NDK when needed
        
        return true;
    } catch (error) {
        console.error('Profile update failed:', error);
        throw error;
    }
}

/**
 * Attempts to auto-login based on stored credentials
 * @returns {Promise<{user: NDKUser, ndk: NDK} | null>}
 */
export async function autoLogin() {
    try {
        if (!browser) return null;
        
        const loginMethod = localStorage.getItem(STORAGE_KEY_LOGIN_METHOD);
        
        if (loginMethod === 'nip07' && 'nostr' in window) {
            // Auto-login with NIP-07
            return await loginWithNip07();
        } else if (loginMethod === 'privateKey') {
            // Auto-login with private key
            const nsec = localStorage.getItem(STORAGE_KEY_NSEC);
            if (nsec) {
                return await loginWithPrivateKey(nsec);
            }
        }
        
        return null;
    } catch (error) {
        console.error('Auto-login failed:', error);
        return null;
    }
}

/**
 * Logs the user out
 */
export function logout() {
    if (browser) {
        localStorage.removeItem(STORAGE_KEY_NSEC);
        localStorage.removeItem(STORAGE_KEY_LOGIN_METHOD);
    }
    
    setCurrentUser(null);
    goto('/login');
} 