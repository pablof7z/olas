import * as SQLite from 'expo-sqlite';

import { migrations } from './migrations';
import { lastDayOfDecade } from 'date-fns';

export const db = SQLite.openDatabaseSync('snap.db');
let dbInitialized = false;

if (!dbInitialized) {
    console.log('Initializing database...');
    let { user_version } = db.getFirstSync('PRAGMA user_version') as { user_version: number };
    console.log('Current user_version:', user_version);
    if (!user_version) user_version = 0;

    const lastVersion = migrations[migrations.length - 1].version;

    if (user_version < lastVersion) {
        for (const migration of migrations) {
            if (migration.version <= user_version) continue;
            migration.up(db);
        }
        db.execSync(`PRAGMA user_version = ${lastVersion}`);
    }

    dbInitialized = true;
} else {
    console.warn('Database already initialized');
}