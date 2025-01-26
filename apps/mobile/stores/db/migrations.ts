import * as SQLite from 'expo-sqlite';

export const migrations = [
    {
        version: 0,
        up: (db: SQLite.SQLiteDatabase) => {
            db.execSync(
                `CREATE TABLE IF NOT EXISTS unpublished_events (
                    id TEXT PRIMARY KEY,
                    event TEXT,
                    relays TEXT,
                    last_try_at INTEGER
                );`
            );
        }
    },
    {
        version: 1,
        up: (db: SQLite.SQLiteDatabase) => {
            db.execSync(
                `CREATE TABLE IF NOT EXISTS nip60_wallet_proofs (
                    wallet_id TEXT,
                    proof_c TEXT,
                    mint TEXT,
                    token_id TEXT,
                    state TEXT,
                    raw TEXT,
                    created_at INTEGER,
                    updated_at INTEGER,
                    PRIMARY KEY (wallet_id, proof_c, mint),
                    UNIQUE (wallet_id, proof_c, mint)
                );`
            );
        }
    },

    {
        version: 2,
        up: (db: SQLite.SQLiteDatabase) => {
            db.execSync(
                `CREATE TABLE IF NOT EXISTS blacklisted_words (
                    word TEXT PRIMARY KEY,
                    created_at INTEGER,
                    updated_at INTEGER
                );`
            );
        }
    }
];