// app/_shared/lib/cache/data-cache.service.ts

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    key: string;
    ttl: number;
}

interface CacheOptions {
    ttlMs?: number;
    maxSize?: number;
    skipCache?: boolean;
}

interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    hitRate: string;
    cacheSize: number;
    maxSize: number;
}

/**
 * Application-wide data caching service
 * Replaces all individual caching implementations with unified system
 */
export class DataCacheService {
    private static instance: DataCacheService | null = null;
    private cache = new Map<string, CacheEntry<any>>();
    private readonly maxSize = 500; // Global cache size limit

    // Cache statistics for monitoring
    private stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
    };

    // Pending promises to prevent duplicate API calls
    private pendingPromises = new Map<string, Promise<any>>();

    private constructor() {
        // Cleanup expired entries every 2 minutes
        setInterval(() => this.cleanup(), 120000);
    }

    static getInstance(): DataCacheService {
        if (!DataCacheService.instance) {
            DataCacheService.instance = new DataCacheService();
        }
        return DataCacheService.instance;
    }

    /**
     * Get data from cache or execute fetch function
     * Includes promise deduplication to prevent concurrent calls
     */
    async get<T>(key: string, fetchFunction: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
        const { ttlMs = 60000, skipCache = false } = options; // Default 1 minute TTL

        // Skip cache if requested
        if (skipCache) {
            console.log(`🔄 CACHE SKIP: ${key} - skipCache=true`);
            return await this.executeWithDeduplication(key, fetchFunction);
        }

        // Check for valid cached data
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            this.stats.hits++;
            const age = Date.now() - cached.timestamp;
            console.log(`✅ CACHE HIT: ${key} (age: ${age}ms, ttl: ${cached.ttl}ms)`);
            return cached.data;
        }

        // Cache miss - fetch new data with deduplication
        this.stats.misses++;
        console.log(`❌ CACHE MISS: ${key} - fetching fresh data (ttl: ${ttlMs}ms)`);

        try {
            const data = await this.executeWithDeduplication(key, fetchFunction);
            this.set(key, data, ttlMs);
            return data;
        } catch (error) {
            // Return stale data if available and fresh fetch fails
            if (cached) {
                console.warn(`⚠️ CACHE: Fresh fetch failed for ${key}, returning stale data`);
                return cached.data;
            }
            throw error;
        }
    }

    /**
     * Set cache entry with TTL
     */
    set<T>(key: string, data: T, ttlMs: number): void {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            key,
            ttl: ttlMs,
        });

        console.log(`💾 CACHE SET: ${key} (ttl: ${ttlMs}ms, cache size: ${this.cache.size})`);
    }

    /**
     * Execute function with promise deduplication
     * Prevents multiple concurrent calls to the same fetch function
     */
    private async executeWithDeduplication<T>(key: string, fetchFunction: () => Promise<T>): Promise<T> {
        // Return existing promise if already in flight
        if (this.pendingPromises.has(key)) {
            console.log(`⏳ PROMISE DEDUP: ${key} - returning existing promise`);
            return this.pendingPromises.get(key) as Promise<T>;
        }

        // Create new promise and track it
        const promise = fetchFunction().finally(() => {
            this.pendingPromises.delete(key);
        });

        this.pendingPromises.set(key, promise);
        return promise;
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            console.log(`🗑️ CACHE INVALIDATED: ${key}`);
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
            console.log(`🗑️ CACHE PATTERN INVALIDATED: ${pattern} (${deletedCount} entries)`);
        }
        return deletedCount;
    }

    /**
     * Invalidate multiple cache keys
     */
    invalidateMultiple(keys: string[]): number {
        let deletedCount = 0;
        for (const key of keys) {
            if (this.cache.delete(key)) {
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            console.log(`🗑️ CACHE BULK INVALIDATED: ${deletedCount} entries`);
        }
        return deletedCount;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.pendingPromises.clear();
        console.log(`🧹 CACHE CLEARED: ${size} entries removed`);
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0';

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
     * Get cache entry info for debugging
     */
    getCacheInfo(key: string): { exists: boolean; age?: number; ttl?: number; expired?: boolean } {
        const entry = this.cache.get(key);
        if (!entry) {
            return { exists: false };
        }

        const age = Date.now() - entry.timestamp;
        const expired = age >= entry.ttl;

        return {
            exists: true,
            age,
            ttl: entry.ttl,
            expired,
        };
    }

    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;
        return Date.now() - entry.timestamp < entry.ttl;
    }

    /**
     * Remove expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp >= entry.ttl) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 CACHE CLEANUP: Removed ${cleanedCount} expired entries`);
        }
    }

    /**
     * Evict oldest cache entry when cache is full
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
            console.log(`🗑️ CACHE EVICTED: ${oldestKey} (cache full)`);
        }
    }
}

// Export singleton instance
export const dataCache = DataCacheService.getInstance();
