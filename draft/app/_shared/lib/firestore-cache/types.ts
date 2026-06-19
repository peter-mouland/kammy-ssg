/* Location: app/_shared/lib/firestore-cache/types.ts */
// biome-ignore-all lint/style/useNamingConvention: external API shape uses snake_case

// src/lib/firestore-cache/types.ts
export interface CacheDocument {
    id: string;
    data: unknown;
    lastUpdated: string; // ISO string
    source: 'fpl' | 'fpl-with-draft' | 'sheets' | 'enhanced';
}
