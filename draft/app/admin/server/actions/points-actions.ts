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
            // Enhanced success message with points population
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

export async function handleForceRerunTransfers(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Force regenerating all team rosters (transfers)...');

        const gameweekService = new GameweekPointsService();
        const result = await gameweekService.forceRerunTransfers();

        // Enhanced success message with points population
        let message = `🔄 All transfers reran! ${result.playerCount} players updated for gameweek ${result.currentGameweek}`;

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

// Unchanged status action
export async function handleGetGameweekPointsStatus(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Getting gameweek points status...');

        const gameweekService = new GameweekPointsService();
        const status = await gameweekService.getPointsStatus();

        return {
            success: true,
            message: 'Points status retrieved',
            data: status,
        };
    } catch (error) {
        console.error('Get gameweek points status error:', error);
        throw new Error(
            `Failed to get gameweek points status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}

/**
 * NEW: Standalone action to just ensure division teams documents exist
 * Useful for debugging or manual setup
 */
export async function handleEnsureDivisionTeamDocuments(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Ensuring division team documents exist...');

        const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');
        const { ensureDivisionGameweekDocuments } = await import(
            '../../../scoring/server/services/division-teams-integration.service'
        );

        // Get current gameweek
        const currentGameweek = await fplApiCache.getCurrentGameweek();
        if (!currentGameweek) {
            throw new Error('Could not determine current gameweek');
        }

        // Ensure documents exist for current gameweek and previous gameweek
        // const targetGameweeks = currentGameweek > 1 ? [currentGameweek, currentGameweek + 1] : [currentGameweek];
        const result = await ensureDivisionGameweekDocuments([currentGameweek]);

        let message = `🏟️ Division team documents check complete! ${result.documentsCreated} documents created across ${result.divisionsProcessed} divisions.`;

        if (result.errors.length > 0) {
            message += `\n⚠️ ${result.errors.length} errors occurred (see logs for details).`;
        }

        return {
            success: true,
            message,
            data: {
                currentGameweek,
                // targetGameweeks,
                ...result,
            },
        };
    } catch (error) {
        console.error('Ensure division team documents error:', error);
        throw new Error(
            `Failed to ensure division team documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}
