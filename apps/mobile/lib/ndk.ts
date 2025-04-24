import NDK, { type NDKRelay } from '@nostr-dev-kit/ndk';

import { getRelays } from '@/stores/db/relays';
import { NET_DEBUG } from '@/utils/const';
import { NDKCacheAdapterSqlite, initSignatureVerificationWorklet } from '@nostr-dev-kit/ndk-mobile';

const cacheAdapter = new NDKCacheAdapterSqlite('olas');
cacheAdapter.initialize();

/**
 * 1. Starts the app-database (which contains information about the relay list and stuff like that)
 * 2. Initializes the cache adapter
 * 3. Creates the NDK instance
 * 4. Connects to the relays
 * @returns
 */
export function initializeNDK() {
    const relays = getRelays();
    const filteredRelays = relays.filter((r) => {
        try {
            return new URL(r.url).protocol.startsWith('ws');
        } catch (_e) {
            return false;
        }
    });

    // if there are no relays... we add a few defaults. Otherwise we don't
    if (filteredRelays.length === 0) {
        filteredRelays.push({ url: 'wss://relay.olas.app/', connect: true });
        filteredRelays.push({ url: 'wss://purplepag.es/', connect: true });
        filteredRelays.push({ url: 'wss://relay.primal.net/', connect: true });
    }

    const connectRelays = filteredRelays.filter((r) => r.connect);
    const blacklistedRelays = filteredRelays.filter((r) => !r.connect);

    const opts: any = {};
    if (NET_DEBUG) opts.netDebug = netDebug;

    const ndk = new NDK({
        cacheAdapter,
        explicitRelayUrls: connectRelays.map((r) => r.url),
        blacklistRelayUrls: blacklistedRelays.map((r) => r.url),
        enableOutboxModel: true,
        initialValidationRatio: 0.0,
        lowestValidationRatio: 0.0,
        clientName: 'olas',
        clientNip89:
            '31990:fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52:1731850618505',
        profileConfig: {
            profileRefreshSeconds: 24 * 60 * 60,
        },
        ...opts,
    });
    cacheAdapter.ndk = ndk;

    ndk.connect();

    return ndk;
}

const netDebug = (_msg: string, relay: NDKRelay, direction?: 'send' | 'recv') => {
    const _url = new URL(relay.url);
    if (direction === 'send' && relay.url.match(/olas/)) {
        const asString = JSON.stringify(JSON.parse(_msg), null, 4);
        // prepend a 🟢 to each line
        const lines = asString.split('\n');
        const newLines = lines.map((line) => `🟢 ${line}`);
        const newString = newLines.join('\n');
        console.log(`${newString}`);
    }
    if (direction === 'recv' && relay.url.match(/olas__/)) {
        console.log(`🔴 ${_url.hostname} ${_msg}`);
    }
};

const _timeZero = Date.now();
