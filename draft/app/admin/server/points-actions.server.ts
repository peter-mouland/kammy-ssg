// /admin/server/points-actions.server.ts
import type { AdminActionResult } from '../types';

interface PointsActionParams {
    actionType: string;
}

export async function handlePointsActions(params: PointsActionParams): Promise<AdminActionResult> {
    const { actionType } = params;

    try {
        switch (actionType) {
            // Points Management Actions
            case "generateGameWeekPoints": {
                const { handleGenerateGameweekPoints } = await import('./actions/points-actions');
                return await handleGenerateGameweekPoints();
            }
            case "forceRegenerateAllPoints": {
                const { handleForceRegenerateAllPoints } = await import('./actions/points-actions');
                return await handleForceRegenerateAllPoints();
            }
            case "getGameweekPointsStatus": {
                const { handleGetGameweekPointsStatus } = await import('./actions/points-actions');
                return await handleGetGameweekPointsStatus();
            }
            default:
                throw new Error(`Invalid points action type: ${actionType}`);
        }
    } catch (error) {
        console.error(`Points action error [${actionType}]:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to execute ${actionType}: ${message}`);
    }
}
