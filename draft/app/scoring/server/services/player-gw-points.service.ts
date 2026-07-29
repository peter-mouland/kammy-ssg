/* Location: app/scoring/server/services/player-gw-points.service.ts */

import { fplApiCache } from '../../../_shared/lib/fpl/api-cache';
import type { FplPlayerGameweekData } from '../../../_shared/lib/fpl/fpl-types';
import { readPlayers } from '../../../_shared/lib/sheets/players';
import type { CustomPosition } from '../../../_shared/types/league-types';
import type { EnhancedPlayerData } from '../../../_shared/types/player-types';
import type { PlayerGameweekPointsRow, PlayersSheetData } from '../../../_shared/types/sheets-types';
import { calculateGameweekPoints } from '../../lib/calculations';
import { convertToPlayerGameweekStats } from '../../lib/data-conversion';

/**
 * Build the `player-gw-points` table: every rostered player, with their custom points
 * for each gameweek they played.
 *
 * This used to live inside `_shared/lib/sheets/player-gw-points.ts`, which meant a sheets
 * reader was running the scoring engine to decide what to write — the file even carried a
 * `// todo: should sheets have domains in it?`. The scoring lives here; the sheets module
 * only stores the rows it is handed. See P2.3 in `.kiro/backlog.md`.
 *
 * Returns the header row too, because the gameweek columns are not known until the data
 * has been read — a player with a double gameweek adds a `gw-N-b` column.
 */
export async function generatePlayerGameweekPointsTable(): Promise<{
    dataRows: PlayerGameweekPointsRow[];
    headerRows: string[];
}> {
    console.log('🔄 Generating Gameweek points data...');

    const baseHeaders = ['playerCode', 'webName', 'position', 'teamName'];
    const colHeaders = new Set<string>();

    const [sheetsPlayers, fplPlayers, fplTeams] = await Promise.all([
        readPlayers(),
        fplApiCache.getFplPlayers(),
        fplApiCache.getFplTeams(),
    ]);

    // EnhancedPlayerData carries team_code, not a name. The original code read a
    // `team_name` field that does not exist, so this column was written as `undefined`
    // for every player -- it even carried a `// todo map to name`.
    const teamNameByCode = new Map(fplTeams.map((team) => [team.code, team.name]));

    const sheetsPlayersByCode = sheetsPlayers.reduce<Record<number, PlayersSheetData>>((acc, player) => {
        acc[player.code] = player;
        return acc;
    }, {});

    // Only players the league actually tracks, not all of FPL.
    const filteredFplPlayers = fplPlayers.filter((player) => sheetsPlayersByCode[player.code]);

    if (filteredFplPlayers.length === 0) {
        throw new Error('No players found that exist in both FPL data and sheets');
    }

    const playerIds = filteredFplPlayers.map((p) => p.id);
    const fplPlayerGameweeksById = await fplApiCache.getBatchPlayerDetailedStats(playerIds);

    const dataRows: PlayerGameweekPointsRow[] = [];

    filteredFplPlayers.forEach((fplPlayer: EnhancedPlayerData) => {
        const playerSheet = sheetsPlayersByCode[fplPlayer.code];
        if (!playerSheet) return;

        const position = playerSheet.position.toLowerCase() as CustomPosition;
        const playerGameweekData = fplPlayerGameweeksById[fplPlayer.id]?.history || [];

        // A Map because the column order has to follow the gameweeks as they were played.
        const gameweekPoints = new Map<string, number>();

        playerGameweekData.forEach((historyEntry: FplPlayerGameweekData) => {
            const singleGameStats = convertToPlayerGameweekStats(historyEntry);
            const gameweekPointsBreakdown = calculateGameweekPoints([singleGameStats], position);

            // Double gameweek: the second match of the same round gets its own column.
            let colKey = `gw-${historyEntry.round}`;
            if (gameweekPoints.has(colKey)) colKey += '-b';

            gameweekPoints.set(colKey, gameweekPointsBreakdown.total);
            colHeaders.add(colKey);
        });

        dataRows.push({
            playerCode: fplPlayer.code,
            webName: fplPlayer.web_name,
            teamName: teamNameByCode.get(fplPlayer.team_code) ?? '',
            position,
            ...Object.fromEntries(gameweekPoints),
        });
    });

    console.log(`✅ Generated Gameweek points for ${dataRows.length} players`);

    const headerRows = [
        ...baseHeaders,
        ...[...colHeaders].sort((a, b) =>
            Number.parseInt(a.replace(/\D/g, ''), 10) > Number.parseInt(b.replace(/\D/g, ''), 10) ? 1 : -1,
        ),
    ];

    return { headerRows, dataRows };
}
