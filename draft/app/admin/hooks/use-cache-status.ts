// /admin/hooks/use-cache-status.ts
import { useState, useEffect } from 'react';

interface CacheStatusData {
    health?: {
        overall: 'healthy' | 'warning' | 'critical';
    };
    completionPercentage?: number;
    counts?: {
        teams?: number;
        events?: number;
        elements?: number;
        elementSummaries?: number;
    };
    missing?: {
        teams?: boolean;
        events?: boolean;
        elements?: boolean;
        elementSummaries?: boolean;
    };
    hasEnhancedData?: boolean;
}

interface CacheStatusHook {
    data: CacheStatusData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useCacheStatus(): CacheStatusHook {
    const [data, setData] = useState<CacheStatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCacheStatus = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/admin/api/cache-status');
            const result = await response.json();

            if (result.success && result.data) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to fetch cache status');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCacheStatus();
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchCacheStatus
    };
}
