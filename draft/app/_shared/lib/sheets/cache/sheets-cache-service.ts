// /_shared/lib/sheets/cache/sheets-cache-service.ts
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    key: string;
}

interface CacheOptions {
    ttlMs?: number; // Time to live in milliseconds
    maxSize?: number; // Maximum cache entries
}

export class SheetsCacheService {
    private static instance: SheetsCacheService;
    private cache = new Map<string, CacheEntry<any>>();
    private readonly defaultTtlMs = 30000; // 30 seconds default
    private readonly maxSize = 100; // Maximum cache entries

    // Cache hit/miss stats for monitoring
    private stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
    };

    private constructor() {
        // Start cleanup interval every 60 seconds
        setInterval(() => this.cleanup(), 60000);
    }

    static getInstance(): SheetsCacheService {
        if (!SheetsCacheService.instance) {
            SheetsCacheService.instance = new SheetsCacheService();
        }
        return SheetsCacheService.instance;
    }

    /**
     * Get cached data or execute function if cache miss
     */
    async get<T>(key: string, fetchFunction: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
        const ttlMs = options.ttlMs || this.defaultTtlMs;
        const cached = this.cache.get(key);

        // Check if cache hit and not expired
        if (cached && Date.now() - cached.timestamp < ttlMs) {
            this.stats.hits++;
            console.log(`📋 CACHE HIT: ${key} (age: ${Date.now() - cached.timestamp}ms)`);
            return cached.data;
        }

        // Cache miss or expired - fetch new data
        this.stats.misses++;
        console.log(`📋 CACHE MISS: ${key} - fetching fresh data`);

        try {
            const data = await fetchFunction();
            this.set(key, data, options);
            return data;
        } catch (error) {
            // If we have stale data and fresh fetch fails, return stale data
            if (cached) {
                console.warn(`📋 CACHE: Fresh fetch failed for ${key}, returning stale data`);
                return cached.data;
            }
            throw error;
        }
    }

    /**
     * Set cache entry
     */
    set<T>(key: string, data: T, _options: CacheOptions = {}): void {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            key,
        });

        console.log(`📋 CACHE SET: ${key} (cache size: ${this.cache.size})`);
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            console.log(`📋 CACHE INVALIDATED: ${key}`);
        }
        return deleted;
    }

    /**
     * Invalidate all cache entries matching a pattern
     */
    invalidatePattern(pattern: string): number {
        let deletedCount = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            console.log(`📋 CACHE INVALIDATED PATTERN: ${pattern} (${deletedCount} entries)`);
        }
        return deletedCount;
    }

    /**
     * Clear all cache
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        console.log(`📋 CACHE CLEARED: ${size} entries removed`);
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const hitRate =
            this.stats.hits + this.stats.misses > 0
                ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1)
                : '0';

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            cacheSize: this.cache.size,
            maxSize: this.maxSize,
        };
    }

    /**
     * Get all cache keys for debugging
     */
    getKeys(): string[] {
        return Array.from(this.cache.keys());
    }

    /**
     * Check if key exists in cache
     */
    has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Get cache entry age in milliseconds
     */
    getAge(key: string): number | null {
        const entry = this.cache.get(key);
        return entry ? Date.now() - entry.timestamp : null;
    }

    /**
     * Remove expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            // Remove entries older than 5 minutes
            if (now - entry.timestamp > 300000) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`📋 CACHE CLEANUP: Removed ${cleanedCount} expired entries`);
        }
    }

    /**
     * Evict oldest cache entry
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTimestamp = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
            console.log(`📋 CACHE EVICTED: ${oldestKey} (cache full)`);
        }
    }
}

// Export singleton instance
export const sheetsCache = SheetsCacheService.getInstance();
