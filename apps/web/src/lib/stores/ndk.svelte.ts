import { browser } from "$app/environment";
import type { NDKCacheAdapter } from "@nostr-dev-kit/ndk";
import NDK from "@nostr-dev-kit/ndk-svelte/svelte5";
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";

let cacheAdapter: NDKCacheAdapter | undefined = $state(undefined);

if (browser) {
    cacheAdapter = new NDKCacheAdapterDexie({ dbName: "olas" });
}

export const ndkStore = new NDK({
    explicitRelayUrls: [
        "wss://relay.olas.app",
        "wss://f7z.io",
        "wss://relay.damus.io",
        "wss://relay.primal.net",
    ],
    outboxRelayUrls: ["wss://purplepag.es", "wss://relay.primal.net"],
    autoConnectUserRelays: true,
    autoFetchUserMutelist: true,
    enableOutboxModel: true,
    cacheAdapter: cacheAdapter,
    clientName: "Olas web",
    clientNip89: "31990:fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52:1731850618505"
});

ndkStore.connect().then(() => console.log("NDK Connected"));

// Create a singleton instance that is the default export
const ndk = $state(ndkStore);

export const bunkerNDKStore = new NDK({
    explicitRelayUrls: [
        "wss://relay.nsecbunker.com",
        "wss://relay.damus.io",
        "wss://relay.primal.net",
        "wss://relay.nostr.band",
    ],
    enableOutboxModel: false,
});

bunkerNDKStore.connect().then(() => console.log("Bunker NDK Connected"));
export const bunkerNdk = $state(bunkerNDKStore);
export default ndk;
