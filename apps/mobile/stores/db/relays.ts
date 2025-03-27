import { db } from '.';

export type RelayEntry = {
    url: string;
    connect: boolean;
};

export function getRelays(): RelayEntry[] {
    const relays = db.getAllSync('SELECT * FROM relays') as RelayEntry[];
    return relays;
}

export function setRelays(autoconnect: Set<string>, blacklist: Set<string>) {
    db.execSync('DELETE FROM relays');
    for (const url of autoconnect) {
        db.runSync('INSERT INTO relays (url, connect) VALUES (?, 1)', [url, true]);
    }

    for (const url of blacklist) {
        db.runSync('INSERT INTO relays (url, connect) VALUES (?, 0)', [url, false]);
    }
}
