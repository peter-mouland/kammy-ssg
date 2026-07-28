// @vitest-environment happy-dom
/* Location: app/players/components/player-gameweek-table.test.tsx */

import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CustomPosition } from '../../_shared/types/league-types';
import type { GameweekStatWithPoints } from '../../scoring/types/scoring-types';
import { PlayerGameweekTable } from './player-gameweek-table';

/**
 * A gameweek in which the player played the full 90 and did nothing else. Every test
 * overrides only the stats it is actually asserting on, so the cause of an expected
 * points value is visible in the test itself.
 */
const makeGameweek = (overrides: Partial<GameweekStatWithPoints> = {}): GameweekStatWithPoints => ({
    gameweek: 1,
    minutes: 90,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    goalsConceded: 0,
    yellowCards: 0,
    redCards: 0,
    saves: 0,
    penaltiesSaved: 0,
    bonus: 0,
    defensiveContribution: 0,
    clearancesBlocksInterceptions: 0,
    tackles: 0,
    recoveries: 0,
    opponent: 3,
    opponentName: 'ARS',
    wasHome: true,
    teamHScore: 2,
    teamAScore: 1,
    customPoints: null,
    fplPoints: 0,
    generatedAt: null,
    ...overrides,
});

const renderTable = (position: CustomPosition, gameweekStats: GameweekStatWithPoints[], currentGameweek = 1) =>
    render(<PlayerGameweekTable gameweekStats={gameweekStats} position={position} currentGameweek={currentGameweek} />);

const visibleColumns = (): string[] =>
    screen.getAllByRole('columnheader').map((header) => header.textContent?.trim() ?? '');

/**
 * The cell a reader would look at: the column they can see by its header, on the row
 * they can see by its position. Tests never need to know how the columns are built.
 */
const cell = (columnHeader: string, rowIndex = 0): HTMLElement => {
    const columnIndex = visibleColumns().indexOf(columnHeader);
    if (columnIndex === -1) {
        throw new Error(`No "${columnHeader}" column is shown. Visible columns: ${visibleColumns().join(', ')}`);
    }
    // Row 0 of the table is the header row, so data rows start at 1.
    const row = screen.getAllByRole('row')[rowIndex + 1];
    return within(row).getAllByRole('cell')[columnIndex];
};

const tooltipOf = (columnHeader: string, rowIndex = 0): string | null => cell(columnHeader, rowIndex).title;

describe('PlayerGameweekTable columns', () => {
    it('shows the saves and penalties saved columns for a goalkeeper', () => {
        renderTable('gk', [makeGameweek()]);

        expect(visibleColumns()).toContain('Saves');
        expect(visibleColumns()).toContain('Pen S');
    });

    it('hides the saves and penalties saved columns for an outfield player', () => {
        renderTable('mid', [makeGameweek()]);

        expect(visibleColumns()).not.toContain('Saves');
        expect(visibleColumns()).not.toContain('Pen S');
    });

    it('hides the clean sheet column for a forward', () => {
        renderTable('wa', [makeGameweek()]);

        expect(visibleColumns()).not.toContain('CS');
    });

    // A midfielder is not a defender but still scores for clean sheets, so this is the
    // case most likely to be broken by someone "tidying up" the defensive positions.
    it('shows the clean sheet column for a midfielder', () => {
        renderTable('mid', [makeGameweek()]);

        expect(visibleColumns()).toContain('CS');
    });

    it('shows the goals conceded column for a full back', () => {
        renderTable('fb', [makeGameweek()]);

        expect(visibleColumns()).toContain('GC');
    });

    it('hides the goals conceded column for a midfielder', () => {
        renderTable('mid', [makeGameweek()]);

        expect(visibleColumns()).not.toContain('GC');
    });

    it.each(['fb', 'cb', 'mid'] as const)('shows the defensive contribution column for a %s', (position) => {
        renderTable(position, [makeGameweek()]);

        expect(visibleColumns()).toContain('DC');
    });

    // Only fb, cb and mid have a defensive contribution rule; a DC column anywhere else
    // would be a column that can never score.
    it.each(['gk', 'wa', 'ca'] as const)('hides the defensive contribution column for a %s', (position) => {
        renderTable(position, [makeGameweek()]);

        expect(visibleColumns()).not.toContain('DC');
    });

    it.each(['cb', 'mid'] as const)('shows the bonus column for a %s', (position) => {
        renderTable(position, [makeGameweek()]);

        expect(visibleColumns()).toContain('Bonus');
    });

    it.each(['gk', 'fb', 'wa', 'ca'] as const)('hides the bonus column for a %s', (position) => {
        renderTable(position, [makeGameweek()]);

        expect(visibleColumns()).not.toContain('Bonus');
    });
});

describe('PlayerGameweekTable stat tooltips', () => {
    it('reports 3 points for playing 45 minutes or more', () => {
        renderTable('mid', [makeGameweek({ minutes: 90 })]);

        expect(tooltipOf('Min')).toBe('3 points');
    });

    it('reports 1 point for playing under 45 minutes', () => {
        renderTable('mid', [makeGameweek({ minutes: 30 })]);

        expect(tooltipOf('Min')).toBe('1 points');
    });

    it('reports 0 points for an unused substitute', () => {
        renderTable('mid', [makeGameweek({ minutes: 0 })]);

        expect(tooltipOf('Min')).toBe('0 points');
    });

    it('reports 10 points for a goal scored by a goalkeeper', () => {
        renderTable('gk', [makeGameweek({ goals: 1 })]);

        expect(tooltipOf('Goals')).toBe('10 points');
    });

    it('reports 8 points for a goal scored by a centre back', () => {
        renderTable('cb', [makeGameweek({ goals: 1 })]);

        expect(tooltipOf('Goals')).toBe('8 points');
    });

    // Same stat, same table, a third of the points: goal value is entirely positional.
    it('reports 4 points per goal for a midfielder', () => {
        renderTable('mid', [makeGameweek({ goals: 2 })]);

        expect(tooltipOf('Goals')).toBe('8 points'); // 2 goals x 4
    });

    it('reports 3 points per assist regardless of position', () => {
        renderTable('wa', [makeGameweek({ assists: 2 })]);

        expect(tooltipOf('Assists')).toBe('6 points'); // 2 assists x 3
    });

    it('reports 5 points for a goalkeeper clean sheet', () => {
        renderTable('gk', [makeGameweek({ cleanSheets: 1 })]);

        expect(tooltipOf('CS')).toBe('5 points');
    });

    it('reports 2 points for a midfielder clean sheet', () => {
        renderTable('mid', [makeGameweek({ cleanSheets: 1 })]);

        expect(tooltipOf('CS')).toBe('2 points');
    });

    // The first goal conceded is free, so a defender who conceded once is not punished.
    it('reports 0 points for a single goal conceded', () => {
        renderTable('cb', [makeGameweek({ goalsConceded: 1 })]);

        expect(tooltipOf('GC')).toBe('0 points');
    });

    it('reports a penalty from the second goal conceded onwards', () => {
        renderTable('cb', [makeGameweek({ goalsConceded: 3 })]);

        expect(tooltipOf('GC')).toBe('-2 points'); // 3 x -1, plus the free first goal
    });

    it('reports 0 points for saves at the threshold', () => {
        renderTable('gk', [makeGameweek({ saves: 2 })]);

        expect(tooltipOf('Saves')).toBe('0 points');
    });

    it('reports 1 point per three saves once the threshold is passed', () => {
        renderTable('gk', [makeGameweek({ saves: 6 })]);

        expect(tooltipOf('Saves')).toBe('2 points'); // floor(6 / 3)
    });

    it('reports 5 points per penalty saved', () => {
        renderTable('gk', [makeGameweek({ penaltiesSaved: 1 })]);

        expect(tooltipOf('Pen S')).toBe('5 points');
    });

    it('reports -1 points for a yellow card', () => {
        renderTable('mid', [makeGameweek({ yellowCards: 1 })]);

        expect(tooltipOf('YC')).toBe('-1 points');
    });

    it('reports -3 points for a centre back red card', () => {
        renderTable('cb', [makeGameweek({ redCards: 1 })]);

        expect(tooltipOf('RC')).toBe('-3 points');
    });

    // Attacking positions are punished harder for a red card than defensive ones.
    it('reports -5 points for a midfielder red card', () => {
        renderTable('mid', [makeGameweek({ redCards: 1 })]);

        expect(tooltipOf('RC')).toBe('-5 points');
    });

    it('reports the bonus points awarded', () => {
        renderTable('mid', [makeGameweek({ bonus: 1 })]);

        expect(tooltipOf('Bonus')).toBe('1 points');
    });
});

describe('PlayerGameweekTable defensive contribution tooltip', () => {
    // This is the regression guard. The DC tooltip is computed from the raw components
    // (clearances/blocks/interceptions, tackles, recoveries), NOT from FPL's pre-baked
    // `defensiveContribution` aggregate -- which is deliberately 0 here. A previous
    // version passed the aggregate to the scoring function, so every DC tooltip in the
    // app read "0 points" and nobody noticed, because 0 is a plausible answer.
    it('reports 2 points for a midfielder reaching the CBIRT threshold', () => {
        renderTable('mid', [
            makeGameweek({
                defensiveContribution: 0,
                clearancesBlocksInterceptions: 7,
                tackles: 4,
                recoveries: 1,
            }),
        ]);

        expect(tooltipOf('DC')).toBe('2 points'); // 7 + 4 + 1 = 12, the mid threshold
    });

    it('reports 0 points for a midfielder one short of the CBIRT threshold', () => {
        renderTable('mid', [makeGameweek({ clearancesBlocksInterceptions: 4, tackles: 3, recoveries: 4 })]);

        expect(tooltipOf('DC')).toBe('0 points'); // 4 + 3 + 4 = 11, below 12
    });

    it('reports 1 point for a centre back reaching the CBIT threshold', () => {
        renderTable('cb', [makeGameweek({ defensiveContribution: 0, clearancesBlocksInterceptions: 6, tackles: 4 })]);

        expect(tooltipOf('DC')).toBe('1 points'); // 6 + 4 = 10, the defender threshold
    });

    it('reports 1 point for a full back reaching the CBIT threshold', () => {
        renderTable('fb', [makeGameweek({ clearancesBlocksInterceptions: 8, tackles: 2 })]);

        expect(tooltipOf('DC')).toBe('1 points'); // 8 + 2 = 10
    });

    // Recoveries count towards a midfielder's total but not a defender's, so a defender
    // with plenty of recoveries and not enough CBIT must still score nothing.
    it('reports 0 points for a centre back whose recoveries would have carried them over', () => {
        renderTable('cb', [makeGameweek({ clearancesBlocksInterceptions: 5, tackles: 3, recoveries: 9 })]);

        expect(tooltipOf('DC')).toBe('0 points'); // 5 + 3 = 8 for a defender, below 10
    });
});

describe('PlayerGameweekTable rows', () => {
    it('shows the total custom points for the gameweek', () => {
        renderTable('mid', [makeGameweek({ minutes: 90, goals: 1, clearancesBlocksInterceptions: 7, tackles: 5 })]);

        expect(cell('Points').textContent).toBe('9'); // 90 min = 3, goal = 4, CBIRT 12 = 2
    });

    it('marks the row for the current gameweek as live', () => {
        // Rows arrive newest first, as the player page supplies them.
        renderTable('mid', [makeGameweek({ gameweek: 6 }), makeGameweek({ gameweek: 5 })], 6);

        expect(cell('GW', 0).textContent).toContain('LIVE');
    });

    it('does not mark a completed gameweek as live', () => {
        renderTable('mid', [makeGameweek({ gameweek: 6 }), makeGameweek({ gameweek: 5 })], 6);

        expect(cell('GW', 1).textContent).not.toContain('LIVE');
        expect(screen.getAllByText('LIVE')).toHaveLength(1);
    });

    it('marks no row as live when the current gameweek is not in the data', () => {
        renderTable('mid', [makeGameweek({ gameweek: 6 }), makeGameweek({ gameweek: 5 })], 8);

        expect(screen.queryAllByText('LIVE')).toHaveLength(0);
    });

    it('shows an empty state rather than a table when there are no gameweeks', () => {
        renderTable('mid', []);

        expect(screen.getByText('No gameweek data available')).toBeDefined();
        expect(screen.queryByRole('table')).toBeNull();
    });
});
