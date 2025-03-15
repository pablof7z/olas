import type { Page } from '@playwright/test';
import { generateSecretKey, getPublicKey, nip19, finalizeEvent } from 'nostr-tools';
import type { NostrEvent } from 'nostr-tools';

/**
 * Mocks a NIP-07 Nostr extension in the browser
 */
export async function mockNostrExtension(page: Page) {
    // Generate keys for the mock extension
    const privkey = generateSecretKey();
    const pubkey = getPublicKey(privkey);
    const npub = nip19.npubEncode(pubkey);
    
    // Mock the window.nostr object
    await page.addInitScript(() => {
        // This is injected before the page loads
        Object.defineProperty(window, 'nostr', {
            value: {
                _privateKey: null, // This is just for our mock, not used by actual extensions
                _publicKey: null,
                
                // Get the public key
                async getPublicKey() {
                    return this._publicKey;
                },
                
                // Sign an event
                async signEvent(event: any) {
                    event.pubkey = this._publicKey;
                    event.id = '0000000000000000000000000000000000000000000000000000000000000000';
                    event.sig = '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
                    return event;
                },
                
                // NIP-04 encryption methods
                nip04: {
                    async encrypt(pubkey: string, plaintext: string) {
                        return 'encrypted:' + plaintext;
                    },
                    async decrypt(pubkey: string, ciphertext: string) {
                        return ciphertext.replace('encrypted:', '');
                    }
                }
            },
            writable: false,
            configurable: true
        });
    });
    
    // Set the keys after the page loads
    await page.evaluate((data) => {
        (window as any).nostr._privateKey = data.privkey;
        (window as any).nostr._publicKey = data.pubkey;
    }, { privkey, pubkey });
    
    return { privkey, pubkey, npub };
}

/**
 * Creates an event signing function for testing
 */
export function createEventSigner(privateKey: Uint8Array) {
    return (event: NostrEvent) => {
        return finalizeEvent(event, privateKey);
    };
} 