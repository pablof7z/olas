import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';

export const db = SQLite.openDatabaseSync('snap.db');
let dbInitialized = false;

if (!dbInitialized) {
    let { user_version } = db.getFirstSync('PRAGMA user_version') as { user_version: number };
    if (!user_version) user_version = 0;

    if (user_version < migrations.length) {
        for (let i = user_version; i < migrations.length; i++) {
            migrations[i].up(db);
        }
        db.execSync(`PRAGMA user_version = ${migrations.length}`);
    }

    dbInitialized = true;
}