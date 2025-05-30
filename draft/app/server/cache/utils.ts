export const CACHE_COLLECTION = 'player_stats_cache';
export const CACHE_STATUS_COLLECTION = 'cache_operations';
export const CACHE_VERSION = 'v3'; // Increment due to structure change

export function timestampToDate(timestamp: Date | { seconds: number; nanoseconds: number }): Date {
    if (timestamp instanceof Date) {
        return timestamp;
    }
    // Convert Firestore Timestamp to JavaScript Date
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
}
