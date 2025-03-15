import NDK from "@nostr-dev-kit/ndk-svelte/svelte5";
import { NDKNip07Signer, type NDKUser, NDKPrivateKeySigner, NDKEvent, type NDKTag } from '@nostr-dev-kit/ndk';
import { currentUser, isAuthenticated, ndkInstance } from '../stores/auth';
import ndk, { ndkStore } from '../stores/ndk.svelte';
import * as nostrTools from 'nostr-tools';

// Local storage keys
const STORAGE_KEY_NSEC = 'nostr_wallet_nsec';
const STORAGE_KEY_LOGIN_METHOD = 'nostr_wallet_login_method';

/**
 * Attempts to login using a NIP-07 compatible browser extension
 * @returns {Promise<{user: NDKUser, ndk: NDK, signer: NDKNip07Signer}>}
 */
export async function loginWithNip07() {
    try {
        const signer = new NDKNip07Signer();
        const user = await signer.user();
        
        // Use the global NDK instance but update the signer
        ndk.signer = signer;
        await ndk.assertSigner();
        
        // Update stores
        currentUser.set(user);
        isAuthenticated.set(true);
        ndkInstance.set(ndk);
        
        // Save login method to local storage
        localStorage.setItem(STORAGE_KEY_LOGIN_METHOD, 'nip07');
        
        return { user, ndk, signer };
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
}

/**
 * Attempts to login using a private key (nsec)
 * @param nsec The private key in nsec format
 * @returns {Promise<{user: NDKUser, ndk: NDK, signer: NDKPrivateKeySigner}>}
 */
export async function loginWithPrivateKey(nsec: string) {
    try {
        // Validate nsec format
        if (!nsec.startsWith('nsec')) {
            throw new Error('Invalid private key format. Must start with "nsec"');
        }
        
        // Create the private key signer
        const signer = new NDKPrivateKeySigner(nsec);
        const user = await signer.user();
        
        // Use the global NDK instance but update the signer
        ndk.signer = signer;
        await ndk.assertSigner();
        
        // Update stores
        currentUser.set(user);
        isAuthenticated.set(true);
        ndkInstance.set(ndk);
        
        // Save credentials to local storage
        localStorage.setItem(STORAGE_KEY_NSEC, nsec);
        localStorage.setItem(STORAGE_KEY_LOGIN_METHOD, 'privateKey');
        
        return { user, ndk, signer };
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
        const result = await loginWithPrivateKey(nsec);
        
        return {
            nsec,
            npub,
            ...result
        };
    } catch (error) {
        console.error('Account creation failed:', error);
        throw error;
    }
}

/**
 * Updates the user's profile with a display name
 * @param name The display name to set
 * @returns {Promise<NDKEvent>} The published metadata event
 */
export async function updateProfileName(name: string) {
    try {
        const ndk = getNdk();
        if (!ndk) throw new Error('NDK instance not found');
        
        // Create metadata event (kind 0)
        const metadataEvent = new NDKEvent(ndk);
        metadataEvent.kind = 0;
        
        // Set the content to the metadata JSON
        const metadata = {
            name: name,
            display_name: name
        };
        
        metadataEvent.content = JSON.stringify(metadata);
        
        // Publish the event
        await metadataEvent.publish();
        
        // Update current user
        const user = await ndk.signer?.user();
        if (user) {
            currentUser.set(user);
        }
        
        return metadataEvent;
    } catch (error) {
        console.error('Failed to update profile name:', error);
        throw error;
    }
}

/**
 * Attempts to auto-login based on stored credentials
 * @returns {Promise<{user: NDKUser, ndk: NDK} | null>}
 */
export async function autoLogin() {
    try {
        const loginMethod = localStorage.getItem(STORAGE_KEY_LOGIN_METHOD);
        
        if (loginMethod === 'nip07' && typeof window !== 'undefined' && 'nostr' in window) {
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
    currentUser.set(null);
    isAuthenticated.set(false);
    ndkInstance.set(null);
    
    // Clear stored credentials
    localStorage.removeItem(STORAGE_KEY_NSEC);
    localStorage.removeItem(STORAGE_KEY_LOGIN_METHOD);
}

/**
 * Helper function to get the current NDK instance
 */
function getNdk(): NDK {
    // Return the global NDK instance
    return ndk;
} 