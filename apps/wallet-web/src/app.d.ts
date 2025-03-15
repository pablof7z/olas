// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface Platform {}
    }

    interface Window {
        nostr?: {
            getPublicKey(): Promise<string>;
            signEvent(event: any): Promise<any>;
            nip04?: {
                encrypt(pubkey: string, plaintext: string): Promise<string>;
                decrypt(pubkey: string, ciphertext: string): Promise<string>;
            };
            nip44?: {
                encrypt(pubkey: string, plaintext: string): Promise<string>;
                decrypt(pubkey: string, ciphertext: string): Promise<string>;
            };
        };
    }
}

export {}; 