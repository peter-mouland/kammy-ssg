/* Location: app/transfers/server/actions/transfer-player-lookup.service.ts */

import type { EnhancedPlayerData } from '../../../scoring/types/scoring-types';

/**
 * Get player details by code for transfer operations
 */
export async function getPlayerDetails(playerCode: number): Promise<EnhancedPlayerData | null> {
    try {
        console.log(`🔍 Looking up player with code: ${playerCode}`);

        const { getEnhancedPlayersData } = await import('../../../players/server/enhanced-players.service');
        const enhancedPlayers = await getEnhancedPlayersData();

        const player = enhancedPlayers.find((p) => p.code === playerCode);

        if (!player) {
            console.warn(`⚠️ Player not found with code: ${playerCode}`);
            return null;
        }

        console.log(`✅ Found player: ${player.web_name} (${player.code})`);
        return player;
    } catch (error) {
        console.error(`❌ Failed to lookup player ${playerCode}:`, error);
        return null;
    }
}
