// app/routes/api/cache/health.ts

import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { getHealthReport } from "../../../server/cache/lifecycle";
import { getCacheOperationStatus } from "../../../server/cache/operations";

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const [healthReport, operationStatus] = await Promise.all([
            getHealthReport(),
            getCacheOperationStatus()
        ]);

        return {
            ...healthReport,
            operationStatus,
            structure: 'new_optimized_structure'
        };
    } catch (error) {
        console.error('Error in cache health check:', error);
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            structure: 'unknown'
        };
    }
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        const formData = await request.formData();
        const action = formData.get('action');

        if (action === 'clear_all') {
            const { clearAllCache } = await import("../../../server/cache/lifecycle");
            await clearAllCache();
            return { success: true, message: 'All cache cleared successfully' };
        }

        if (action === 'clear_stuck') {
            const { clearStuckOperations } = await import("../../../server/cache/refresh");
            const result = await clearStuckOperations();
            return {
                success: true,
                message: result.wasStuck ? 'Cleared stuck operation' : 'No stuck operations found',
                result
            };
        }

        if (action === 'cleanup_old') {
            const { cleanupOldGameweeks } = await import("../../../server/cache/gameweek-storage");
            const { getCurrentGameweek } = await import("../../../server/fpl/api");
            const currentGameweek = await getCurrentGameweek();
            await cleanupOldGameweeks(currentGameweek);
            return { success: true, message: 'Old gameweeks cleaned up' };
        }

        if (action === 'archive_seasons') {
            const { archiveOldSeasons } = await import("../../../server/cache/lifecycle");
            await archiveOldSeasons();
            return { success: true, message: 'Old seasons archived' };
        }

        return { success: false, message: 'Invalid action' };
    } catch (error) {
        console.error('Error in cache health action:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
