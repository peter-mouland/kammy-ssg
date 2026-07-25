/* Location: app/players/lib/player-stats-tsv.test.ts */

import { describe, expect, it } from 'vitest';
import type { EnhancedPlayerData } from '../../scoring/types/scoring-types';
import type { PlayerStatsData } from '../types/player-types';
import { buildPlayerStatsTsv, PLAYER_STATS_TSV_HEADERS } from './player-stats-tsv';

function breakdownItem(stat: number) {
    return { label: '', points: 0, stat, formula: '' };
}

function makePlayer(overrides: {
    web_name: string;
    team_code: number;
    position: EnhancedPlayerData['draft']['position'];
    pointsTotal: number;
    code?: number;
    stats?: Partial<Record<keyof EnhancedPlayerData['draft']['pointsBreakdown'], number>>;
}): EnhancedPlayerData {
    const stats = overrides.stats ?? {};
    return {
        id: 1,
        code: overrides.code ?? 1,
        first_name: 'Test',
        second_name: 'Player',
        web_name: overrides.web_name,
        team_code: overrides.team_code,
        draft: {
            position: overrides.position,
            pointsTotal: overrides.pointsTotal,
            pointsBreakdown: {
                appearance: breakdownItem(stats.appearance ?? 90),
                goals: breakdownItem(stats.goals ?? 0),
                assists: breakdownItem(stats.assists ?? 0),
                cleanSheets: breakdownItem(stats.cleanSheets ?? 0),
                yellowCards: breakdownItem(stats.yellowCards ?? 0),
                redCards: breakdownItem(stats.redCards ?? 0),
                saves: breakdownItem(stats.saves ?? 0),
                penaltiesSaved: breakdownItem(stats.penaltiesSaved ?? 0),
                goalsConceded: breakdownItem(stats.goalsConceded ?? 0),
                bonus: breakdownItem(stats.bonus ?? 0),
                defensiveContribution: breakdownItem(stats.defensiveContribution ?? 0),
                total: breakdownItem(overrides.pointsTotal),
            },
        },
    };
}

function makeData(players: EnhancedPlayerData[]): PlayerStatsData {
    return {
        players,
        teamsByCode: {
            1: { code: 1, id: 1, name: 'Arsenal', short_name: 'ARS' },
            2: { code: 2, id: 2, name: 'Chelsea', short_name: 'CHE' },
        } as PlayerStatsData['teamsByCode'],
        positions: { gk: 'gk', fb: 'fb', cb: 'cb', mid: 'mid', wa: 'wa', ca: 'ca' },
    };
}

describe('buildPlayerStatsTsv', () => {
    it('starts with the expected header row', () => {
        const tsv = buildPlayerStatsTsv(makeData([]));
        expect(tsv).toBe(PLAYER_STATS_TSV_HEADERS.join('\t'));
    });

    it('exports a player row with team and position columns', () => {
        const tsv = buildPlayerStatsTsv(
            makeData([
                makePlayer({
                    web_name: 'Salah',
                    code: 118748,
                    team_code: 1,
                    position: 'wa',
                    pointsTotal: 42,
                    stats: { appearance: 180, goals: 3, assists: 1 },
                }),
            ]),
        );

        const [, row] = tsv.split('\n');
        const cells = row.split('\t');

        expect(cells[0]).toBe('118748');
        expect(cells[1]).toBe('Salah');
        expect(cells[2]).toBe('ARS');
        expect(cells[3]).toBe('WA');
        expect(cells[4]).toBe('42');
        expect(cells[5]).toBe('180');
        expect(cells[6]).toBe('3');
        expect(cells[7]).toBe('1');
    });

    it('fills irrelevant position stats with 0 for formula-friendly export', () => {
        const tsv = buildPlayerStatsTsv(
            makeData([
                makePlayer({
                    web_name: 'Haaland',
                    team_code: 2,
                    position: 'ca',
                    pointsTotal: 50,
                    stats: {
                        cleanSheets: 5,
                        penaltiesSaved: 1,
                        saves: 10,
                        goalsConceded: 2,
                        bonus: 3,
                        defensiveContribution: 8,
                    },
                }),
            ]),
        );

        const cells = tsv.split('\n')[1].split('\t');
        // Clean Sheets, Pens Saved, Saves, Goals Con., Bonus, Def. Con.
        expect(cells[8]).toBe('0');
        expect(cells[9]).toBe('0');
        expect(cells[10]).toBe('0');
        expect(cells[11]).toBe('0');
        expect(cells[14]).toBe('0');
        expect(cells[15]).toBe('0');
    });

    it('includes relevant GK defensive stats', () => {
        const tsv = buildPlayerStatsTsv(
            makeData([
                makePlayer({
                    web_name: 'Raya',
                    team_code: 1,
                    position: 'gk',
                    pointsTotal: 30,
                    stats: {
                        cleanSheets: 2,
                        penaltiesSaved: 1,
                        saves: 12,
                        goalsConceded: 3,
                    },
                }),
            ]),
        );

        const cells = tsv.split('\n')[1].split('\t');
        expect(cells[8]).toBe('2');
        expect(cells[9]).toBe('1');
        expect(cells[10]).toBe('12');
        expect(cells[11]).toBe('3');
        expect(cells[14]).toBe('0'); // bonus not relevant for GK
        expect(cells[15]).toBe('0'); // def con not relevant for GK
    });

    it('sorts players by points descending', () => {
        const tsv = buildPlayerStatsTsv(
            makeData([
                makePlayer({ web_name: 'Low', team_code: 1, position: 'mid', pointsTotal: 10 }),
                makePlayer({ web_name: 'High', team_code: 2, position: 'ca', pointsTotal: 99 }),
            ]),
        );

        const rows = tsv.split('\n').slice(1);
        expect(rows[0].split('\t')[1]).toBe('High');
        expect(rows[1].split('\t')[1]).toBe('Low');
    });
});
