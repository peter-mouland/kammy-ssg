// app/lib/server/cache/utils.ts - REPLACE YOUR EXISTING FILE

export function timestampToDate(timestamp: Date | { seconds: number; nanoseconds: number }): Date {
    if (timestamp instanceof Date) {
        return timestamp;
    }
    // Convert Firestore Timestamp to JavaScript Date
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
}
