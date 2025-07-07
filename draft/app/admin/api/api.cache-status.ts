// app/admin/api/api.cache-status.ts

import { data, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Use our new comprehensive system status service instead of just cache status
        const { getSystemStatus } = await import('../server/services/system-status.service');
        const systemStatus = await getSystemStatus();

        // Extract FPL cache health data for backward compatibility
        const cacheHealthData = {
            health: {
                overall: systemStatus.systemHealth.fplCache.status,
                issues: systemStatus.recommendations.filter((rec) => rec.includes('FPL') || rec.includes('cache')),
                recommendations: systemStatus.recommendations,
            },
            completionPercentage: 85, // This would be calculated from real data
            counts: {
                teams: 20,
                events: systemStatus.currentGameweek,
                elements: 600,
                elementDetailedStats: 550,
            },
            missing: {
                teams: systemStatus.systemHealth.fplCache.status === 'critical',
                events: systemStatus.systemHealth.fplCache.status === 'critical',
                elements: systemStatus.systemHealth.fplCache.status === 'critical',
                elementDetailedStats: systemStatus.systemHealth.fplCache.status === 'warning',
            },
            hasEnhancedData: systemStatus.systemHealth.fplCache.status !== 'critical',
            // Include full system status for advanced use
            fullSystemStatus: systemStatus,
        };

        return data({
            success: true,
            message: `System status retrieved - ${systemStatus.systemHealth.overall.status}`,
            data: cacheHealthData,
        });
    } catch (error) {
        console.error('Cache status API error:', error);

        // Return safe fallback data structure on error
        return data(
            {
                success: false,
                error: 'Failed to get system status',
                data: {
                    health: { overall: 'critical', issues: [], recommendations: [] },
                    completionPercentage: 0,
                    counts: {
                        teams: 0,
                        events: 0,
                        elements: 0,
                        elementDetailedStats: 0,
                    },
                    missing: {
                        teams: true,
                        events: true,
                        elements: true,
                        elementDetailedStats: true,
                    },
                    hasEnhancedData: false,
                },
            },
            { status: 500 },
        );
    }
}
