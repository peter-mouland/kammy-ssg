/* Location: app/scoring/server/services/enhanced-player-data.service.ts */

/**
 * Generating the season's enhanced player data.
 *
 * This ran inside `_shared/lib/fpl/fpl-firestore.ts`, which meant a shared persistence
 * module imported `scoring/lib` to run the scoring engine -- the last `_shared` -> domain
 * dependency in the codebase, and the same shape as the `player-gw-points` reader that
 * P2.3 moved out for the same reason.
 *
 * The split is: deciding what a player's season data *is* belongs to scoring; storing it
 * belongs to the FPL persistence layer. So this service reads the inputs, runs
 * `generateSeasonData`, and hands the result to `updateElementsWithDraft` to persist.
 * Both of the firestore methods it uses were already public.
 *
 * The FplFirestore instance is passed in rather than constructed here, so the caller
 * reuses the one it already holds instead of opening a second.
 */

import { fplApi } from '../../../_shared/lib/fpl/api';
import type { FplFirestore } from '../../../_shared/lib/fpl/fpl-firestore';
import { readPlayers } from '../../../_shared/lib/sheets/players';
import type { EnhancedPlayerData } from '../../../_shared/types/player-types';
import type { PlayersSheetData } from '../../../_shared/types/sheets-types';
import { generateSeasonData } from '../../lib';

/**
 * Generate enhanced data for every player that exists in both FPL and the Players sheet,
 * and cache it back onto the stored FPL elements.
 */
export const generateAndCacheEnhancedData = async (fplFirestore: FplFirestore): Promise<EnhancedPlayerData[]> => {
    console.log('🔄 generateAndCacheEnhancedData() - Starting fresh generation...');

    // Get base FPL data
    const players = await fplFirestore.getElements();
    const sheetsPlayers = await readPlayers();

    // Filter to only players that exist in sheets
    const sheetsPlayersByCode = sheetsPlayers.reduce((acc: Record<string, PlayersSheetData>, player) => {
        acc[player.code] = player;
        return acc;
    }, {});
    const filteredPlayers = players.filter((player) => sheetsPlayersByCode[player.code]);
    const playerIds = filteredPlayers.map((p) => p.id);
    const fplPlayerGameweeksById = await fplApi.getBatchPlayerDetailedStats(playerIds);

    if (filteredPlayers.length === 0) {
        throw new Error('No players found that exist in both FPL data and sheets');
    }

    console.log(`🔄 Generating enhanced data for ${filteredPlayers.length} players...`);

    const enhancedPlayers = generateSeasonData(filteredPlayers, fplPlayerGameweeksById, sheetsPlayersByCode);
    const playersById = enhancedPlayers.reduce((acc: Record<string, EnhancedPlayerData>, player) => {
        acc[player.id] = player;
        return acc;
    }, {});
    await fplFirestore.updateElementsWithDraft(playersById);

    console.log(`✅ Enhanced data generated and cached for ${enhancedPlayers.length} players`);
    return enhancedPlayers;
};
