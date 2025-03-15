import { browser } from "$app/environment";
import type { NDKCacheAdapter } from "@nostr-dev-kit/ndk";
import NDK from "@nostr-dev-kit/ndk-svelte/svelte5";
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";

let cacheAdapter: NDKCacheAdapter | undefined = $state(undefined);

if (browser) {
    cacheAdapter = new NDKCacheAdapterDexie({ dbName: "wallet-web" });
}

// Create the NDK instance with relays
export const ndkStore = new NDK({
    explicitRelayUrls: [
        "wss://relay.damus.io",
        "wss://relay.olas.app",
        "wss://relay.nostr.band",
        "wss://relay.primal.net",
        "wss://purplepag.es"
    ],
    outboxRelayUrls: ["wss://purplepag.es", "wss://relay.damus.io"],
    autoConnectUserRelays: true,
    autoFetchUserMutelist: true,
    enableOutboxModel: true,
    cacheAdapter: cacheAdapter,
    clientName: "Olas Wallet",
});

// Connect to relays as soon as possible
if (browser) {
    ndkStore.connect().then(() => console.log("NDK Connected"));
}

// Create a singleton instance
const ndk = $state(ndkStore);

export default ndk; 