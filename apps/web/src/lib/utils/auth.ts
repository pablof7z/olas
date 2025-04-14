import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import ndk from '$lib/stores/ndk.svelte';
import { setCurrentUser } from '$lib/stores/currentUser.svelte';
import type { NDKUser } from '@nostr-dev-kit/ndk';

/**
 * Creates a new Nostr account by generating a private key
 * 
 * @returns The created user object or null if creation failed
 */
export async function createAccount(): Promise<NDKUser | null> {
    try {
        // Generate new keys for the user
        const signer = NDKPrivateKeySigner.generate();
        ndk.signer = signer;
        
        // Create a new user
        const user = await signer.user();
        setCurrentUser(user);
        
        return user;
    } catch (error) {
        console.error('Error creating account:', error);
        return null;
    }
}

/**
 * Connects to an existing Nostr extension (NIP-07)
 * 
 * @returns True if connected successfully, false otherwise
 */
export async function connectExtension(): Promise<boolean> {
    try {
        if (!window.nostr) {
            return false;
        }
        
        const { NDKNip07Signer } = await import('@nostr-dev-kit/ndk');
        ndk.signer = new NDKNip07Signer();
        const user = await ndk.signer.user();
        
        if (user) {
            setCurrentUser(user);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error connecting to extension:', error);
        return false;
    }
} 