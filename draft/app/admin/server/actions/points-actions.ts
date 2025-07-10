// app/admin/server/actions/points-actions.ts
import { GameweekPointsService } from '../../../scoring/server/services/gameweek-points.service';
import type { AdminActionResult } from '../../types/admin-types';

// Enhanced "Smart Points Update" action with division teams integration
export async function handleGenerateGameweekPoints(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Checking and updating gameweek points...');

        const gameweekService = new GameweekPointsService();
        const updateResult = await gameweekService.updateGameweekPointsIfNeeded();

        if (updateResult.updated) {
            let message = `✅ Points updated! Generated ${updateResult.gameweeksGenerated.join(', ')} for ${
                updateResult.playerCount
            } players. ${updateResult.reason}`;

            if (updateResult.pointsPopulationResult) {
                const { playersUpdated, documentsUpdated, errors } = updateResult.pointsPopulationResult;
                message += `\n📊 Division Teams: ${playersUpdated} players updated in ${documentsUpdated} documents.`;

                if (errors.length > 0) {
                    message += `\n⚠️ Some errors occurred: ${errors.length} (see logs)`;
                }
            }

            return {
                success: true,
                message,
                data: {
                    gameweeksGenerated: updateResult.gameweeksGenerated,
                    playerCount: updateResult.playerCount,
                    currentGameweek: updateResult.currentGameweek,
                    previousGameweek: updateResult.previousGameweek,
                    reason: updateResult.reason,
                    pointsPopulationResult: updateResult.pointsPopulationResult,
                },
            };
        } else {
            return {
                success: true,
                message: `ℹ️ No update needed. ${updateResult.reason}`,
                data: {
                    currentGameweek: updateResult.currentGameweek,
                    previousGameweek: updateResult.previousGameweek,
                    reason: updateResult.reason,
                },
            };
        }
    } catch (error) {
        console.error('Generate gameweek points error:', error);
        throw new Error(
            `Failed to update gameweek points: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

// Enhanced "Force Regenerate All Points" action with division teams integration
export async function handleForceRegenerateAllPoints(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Force regenerating all points...');

        const gameweekService = new GameweekPointsService();
        const result = await gameweekService.forceFullRegeneration();

        // Enhanced success message with points population
        let message = `🔄 All points regenerated! ${result.playerCount} players updated for gameweek ${result.currentGameweek}`;

        if (result.pointsPopulationResult) {
            const { playersUpdated, documentsUpdated, errors } = result.pointsPopulationResult;
            message += `\n📊 Division Teams: ${playersUpdated} players updated in ${documentsUpdated} documents.`;

            if (errors.length > 0) {
                message += `\n⚠️ Some errors occurred: ${errors.length} (see logs)`;
            }
        }

        return {
            success: true,
            message,
            data: result,
        };
    } catch (error) {
        console.error('Force regenerate all points error:', error);
        throw new Error(`Failed to regenerate all points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
