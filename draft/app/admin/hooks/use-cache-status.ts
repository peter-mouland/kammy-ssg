// app/admin/hooks/use-cache-status.ts

import { useEffect, useState } from 'react';

interface CacheStatusData {
    health?: {
        overall: 'healthy' | 'warning' | 'critical';
        issues?: string[];
        recommendations?: string[];
    };
    completionPercentage?: number;
    counts?: {
        teams?: number;
        events?: number;
        elements?: number;
        elementDetailedStats?: number;
    };
    missing?: {
        teams?: boolean;
        events?: boolean;
        elements?: boolean;
        elementDetailedStats?: boolean;
    };
    hasEnhancedData?: boolean;
    // Enhanced with full system status
    systemHealth?: {
        overall: 'healthy' | 'warning' | 'critical';
        fplCache: 'healthy' | 'warning' | 'critical';
        firebase: 'healthy' | 'warning' | 'critical';
        googleSheets: 'healthy' | 'warning' | 'critical';
    };
    additionalStatus?: {
        pendingTransfers: number;
        draftActive: boolean;
        gameweekUpToDate: boolean;
        recommendations: string[];
    };
    // Include raw system status for advanced components
    fullSystemStatus?: any;
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

            const response = await fetch('/api/cache-status');
            const result = await response.json();

            if (result.success && result.data) {
                setData(result.data);
                console.log('✅ Cache status loaded with enhanced system data:', result.data);
            } else {
                setError(result.error || 'Failed to fetch cache status');
                console.error('❌ Cache status fetch failed:', result.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
            console.error('❌ Cache status network error:', err);
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
        refetch: fetchCacheStatus,
    };
}

/**
 * New hook specifically for comprehensive system status
 * Use this for components that need the full system picture
 */
export function useSystemStatus() {
    const { data, loading, error, refetch } = useCacheStatus();

    return {
        systemHealth: data?.systemHealth || null,
        additionalStatus: data?.additionalStatus || null,
        fullSystemStatus: data?.fullSystemStatus || null,
        cacheHealth: data?.health || null,
        loading,
        error,
        refetch,
    };
}
