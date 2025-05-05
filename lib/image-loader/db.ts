import { db } from '@/stores/db';
import type { DbImageCacheEntry } from './types';

const WRITE_DEBOUNCE_MS = 1000;

type WriteQueueItem = {
    sql: string;
    params: (string | number | null)[];
    resolve: () => void;
    reject: (err: unknown) => void;
};

let writeQueue: WriteQueueItem[] = [];
let debounceTimer: NodeJS.Timeout | null = null;
let flushing = false;

/**
 * Flushes the write queue, executing all pending SQL statements in order.
 * Returns a promise that resolves when all jobs are completed.
 */
async function flushWriteQueue(): Promise<void> {
    if (flushing) {
        // Prevent re-entrancy
        return;
    }
    flushing = true;
    const jobs = writeQueue;
    writeQueue = [];
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    if (jobs.length === 0) {
        flushing = false;
        return;
    }

    try {
        for (const job of jobs) {
            db.runAsync(job.sql, job.params)
                .then(() => job.resolve())
                .catch((err) => job.reject(err));
        }
    } finally {
        flushing = false;
    }
}

function scheduleFlush() {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
        flushWriteQueue().catch(() => {
            // Errors are handled per-job
        });
    }, WRITE_DEBOUNCE_MS);
}

/**
 * Inserts or updates an image cache entry.
 * If an entry for the same originalUrl+width exists, it will be replaced.
 */
export async function upsertImageCacheEntry(entry: DbImageCacheEntry): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        writeQueue.push({
            sql: `INSERT OR REPLACE INTO image_cache (original_url, fetched_url, width, state, attempts)
            VALUES (?, ?, ?, ?, ?, ?)`,
            params: [
                entry.originalUrl,
                entry.fetchedUrl || null,
                entry.width,
                entry.state,
                entry.attempts,
            ],
            resolve,
            reject,
        });
        scheduleFlush();
    });
}

/**
 * Marks an image variation as permanently failed and increments attempts.
 */
export async function markImageCacheFailure(
    originalUrl: string,
    width: number | null,
    state: string,
    filesystemKey: string
): Promise<void> {
    // This implementation increments attempts to 1 (if not present) or by 1 (if present)
    // by using a subquery for attempts.
    return new Promise<void>((resolve, reject) => {
        writeQueue.push({
            sql: `
        INSERT OR REPLACE INTO image_cache (original_url, width, state, attempts)
        VALUES (
          ?,
          ?,
          'error',
          ?,
          COALESCE((SELECT attempts FROM image_cache WHERE original_url = ? AND width IS ?), 0) + 1
        )
      `,
            params: [originalUrl, width, state, originalUrl, width],
            resolve,
            reject,
        });
        scheduleFlush();
    });
}

/**
 * Increments the attempts count for a given variation.
 */
export async function incrementImageCacheAttempts(
    originalUrl: string,
    width: number | null
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        writeQueue.push({
            sql: 'UPDATE image_cache SET attempts = COALESCE(attempts, 0) + 1 WHERE original_url = ? AND width IS ?',
            params: [originalUrl, width],
            resolve,
            reject,
        });
        scheduleFlush();
    });
}

/**
 * Retrieves all cached image entries.
 * Returns an array of { url, width, state, filesystemKey, attempts }
 */
export async function getAllImageCacheEntries(): Promise<DbImageCacheEntry[]> {
    // Ensure all pending writes are flushed before reading
    await flushWriteQueue();
    const query =
        'SELECT original_url as originalUrl, fetched_url as fetchedUrl, width, state, attempts FROM image_cache';
    try {
        const results = await db.getAllAsync(query);
        return results as DbImageCacheEntry[];
    } catch (error) {
        console.error('[ImageLoader] Query error:', error);
        throw error;
    }
}
