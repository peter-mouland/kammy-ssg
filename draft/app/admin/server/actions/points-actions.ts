// /admin/server/actions/points-actions.ts
import { GameweekPointsService } from "../../../scoring/server/services/gameweek-points.service";
import type { AdminActionResult } from "../../types";

// EXACT COPY from "generateGameWeekPoints" case (with original detailed response)
export async function handleGenerateGameweekPoints(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Checking and updating gameweek points...');

        const gameweekService = new GameweekPointsService();
        const updateResult = await gameweekService.updateGameweekPointsIfNeeded();

        if (updateResult.updated) {
            return {
                success: true,
                message: `✅ Points updated! Generated ${updateResult.gameweeksGenerated.join(', ')} for ${updateResult.playerCount} players. ${updateResult.reason}`,
                data: {
                    gameweeksGenerated: updateResult.gameweeksGenerated,
                    playerCount: updateResult.playerCount,
                    currentGameweek: updateResult.currentGameweek,
                    previousGameweek: updateResult.previousGameweek,
                    reason: updateResult.reason
                }
            };
        } else {
            return {
                success: true,
                message: `ℹ️ No update needed. ${updateResult.reason}`,
                data: {
                    currentGameweek: updateResult.currentGameweek,
                    previousGameweek: updateResult.previousGameweek,
                    reason: updateResult.reason
                }
            };
        }
    } catch (error) {
        console.error('Generate gameweek points error:', error);
        throw new Error(`Failed to update gameweek points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// EXACT COPY from "forceRegenerateAllPoints" case
export async function handleForceRegenerateAllPoints(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Force regenerating all points...');

        const gameweekService = new GameweekPointsService();
        const result = await gameweekService.forceFullRegeneration();

        return {
            success: true,
            message: `🔄 All points regenerated! ${result.playerCount} players updated for gameweek ${result.currentGameweek}`,
            data: result
        };
    } catch (error) {
        console.error('Force regenerate all points error:', error);
        throw new Error(`Failed to regenerate all points: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// EXACT COPY from "getGameweekPointsStatus" case
export async function handleGetGameweekPointsStatus(): Promise<AdminActionResult> {
    try {
        console.log('🔄 Getting gameweek points status...');

        const gameweekService = new GameweekPointsService();
        const status = await gameweekService.getPointsStatus();

        return {
            success: true,
            message: `Points status retrieved`,
            data: status
        };
    } catch (error) {
        console.error('Get gameweek points status error:', error);
        throw new Error(`Failed to get gameweek points status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
