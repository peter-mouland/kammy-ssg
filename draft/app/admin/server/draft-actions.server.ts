// /admin/server/draft-actions.server.ts
import type { AdminActionResult } from '../types';

interface DraftActionParams {
    actionType: string;
    divisionId?: string;
}

export async function handleDraftActions(params: DraftActionParams): Promise<AdminActionResult> {
    const { actionType, divisionId } = params;

    try {
        switch (actionType) {
            // Draft Management Actions
            case "generateOrder": {
                const { handleGenerateOrder } = await import('./actions/draft-actions');
                return await handleGenerateOrder({ actionType, divisionId });
            }
            case "clearOrder": {
                const { handleClearOrder } = await import('./actions/draft-actions');
                return await handleClearOrder({ actionType, divisionId });
            }
            case "startDraft": {
                const { handleStartDraft } = await import('./actions/draft-actions');
                return await handleStartDraft({ actionType, divisionId });
            }
            case "stopDraft": {
                const { handleStopDraft } = await import('./actions/draft-actions');
                return await handleStopDraft();
            }
            case "syncDraft": {
                const { handleSyncDraft } = await import('./actions/draft-actions');
                return await handleSyncDraft({ actionType, divisionId });
            }
            default:
                throw new Error(`Invalid draft action type: ${actionType}`);
        }
    } catch (error) {
        console.error(`Draft action error [${actionType}]:`, error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to execute ${actionType}: ${message}`);
    }
}
