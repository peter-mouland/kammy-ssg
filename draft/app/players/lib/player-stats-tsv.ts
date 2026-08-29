/* Location: app/players/lib/player-stats-tsv.ts */

import type { EnhancedPlayerData } from '../../_shared/types/player-types';
import { isStatRelevant } from '../../scoring';
import type { PlayerStatsData } from '../types/player-types';

export const PLAYER_STATS_TSV_HEADERS = [
    'Code',
    'Player',
    'Team',
    'Position',
    'Points',
    'Mins',
    'Goals',
    'Assists',
    'Clean Sheets',
    'Pens Saved',
    'Saves',
    'Goals Con.',
    'Yellow Cards',
    'Red Cards',
    'Def. Con.',
] as const;

function escapeTsvCell(value: string | number): string {
    return String(value).replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

function formatStatCell(player: EnhancedPlayerData, statKey: string, value: number | undefined): string {
    if (!isStatRelevant(statKey, player.draft.position)) {
        return '0';
    }
    return escapeTsvCell(value ?? 0);
}

function playerToTsvRow(player: EnhancedPlayerData, teamShortName: string): string {
    const breakdown = player.draft.pointsBreakdown;

    return [
        escapeTsvCell(player.code),
        escapeTsvCell(player.web_name),
        escapeTsvCell(teamShortName),
        escapeTsvCell(player.draft.position.toUpperCase()),
        escapeTsvCell(player.draft.pointsTotal),
        escapeTsvCell(breakdown.appearance.stat ?? 0),
        escapeTsvCell(breakdown.goals.stat ?? 0),
        escapeTsvCell(breakdown.assists.stat ?? 0),
        formatStatCell(player, 'cleanSheets', breakdown.cleanSheets.stat),
        formatStatCell(player, 'penaltiesSaved', breakdown.penaltiesSaved.stat),
        formatStatCell(player, 'saves', breakdown.saves.stat),
        formatStatCell(player, 'goalsConceded', breakdown.goalsConceded.stat),
        escapeTsvCell(breakdown.yellowCards.stat ?? 0),
        escapeTsvCell(breakdown.redCards.stat ?? 0),
        formatStatCell(player, 'defensiveContribution', breakdown.defensiveContribution.stat),
    ].join('\t');
}

export function buildPlayerStatsTsv(data: PlayerStatsData): string {
    const sortedPlayers = [...data.players].sort((a, b) => b.draft.pointsTotal - a.draft.pointsTotal);

    const rows = sortedPlayers.map((player) => {
        const teamShortName = data.teamsByCode[player.team_code]?.short_name ?? '';
        return playerToTsvRow(player, teamShortName);
    });

    return [PLAYER_STATS_TSV_HEADERS.join('\t'), ...rows].join('\n');
}
