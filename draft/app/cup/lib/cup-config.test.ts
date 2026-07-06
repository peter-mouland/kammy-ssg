/* Location: app/cup/lib/cup-config.test.ts */

import { describe, expect, it } from 'vitest';
import type { CupConfig } from '../types/cup-types';
import {
    getGameweekForStage,
    getRoundForGameweek,
    parseCupConfig,
    resolveCupRounds,
    serializeCupConfig,
} from './cup-config';

const CONFIG: CupConfig = {
    season: '2526',
    league: [21, 22, 23],
    r16: [24, 25],
    qf: [27, 28],
    sf: [30, 32],
    final: 33,
};

describe('resolveCupRounds', () => {
    it('flattens the config into one round per gameweek played', () => {
        const rounds = resolveCupRounds(CONFIG);
        // 3 league + 2 + 2 + 2 knockout legs + 1 final = 10
        expect(rounds).toHaveLength(10);
        expect(rounds.map((r) => r.gameweek)).toEqual([21, 22, 23, 24, 25, 27, 28, 30, 32, 33]);
    });

    it('carries the correct players-required and leg numbers per stage', () => {
        const rounds = resolveCupRounds(CONFIG);
        const final = rounds.find((r) => r.stage === 'final');
        expect(final).toMatchObject({ gameweek: 33, leg: 1, playersRequired: 6, twoLegged: false });

        const r16Leg2 = rounds.find((r) => r.stage === 'r16' && r.leg === 2);
        expect(r16Leg2).toMatchObject({ gameweek: 25, playersRequired: 4, twoLegged: true });
    });
});

describe('gameweek <-> stage lookups', () => {
    it('finds the round played in a gameweek', () => {
        expect(getRoundForGameweek(CONFIG, 27)).toMatchObject({ stage: 'qf', leg: 1 });
        expect(getRoundForGameweek(CONFIG, 99)).toBeNull();
    });

    it('finds the gameweek for a stage/leg', () => {
        expect(getGameweekForStage(CONFIG, 'sf', 2)).toBe(32);
        expect(getGameweekForStage(CONFIG, 'final')).toBe(33);
        expect(getGameweekForStage(CONFIG, 'qf', 3)).toBeNull();
    });
});

describe('parse/serialize config rows (sheet round-trip)', () => {
    it('parses key/value rows into a typed config', () => {
        const parsed = parseCupConfig([
            { key: 'season', value: '2526' },
            { key: 'league', value: '21, 22, 23' },
            { key: 'r16', value: '24,25' },
            { key: 'qf', value: '27,28' },
            { key: 'sf', value: '30,32' },
            { key: 'final', value: '33' },
        ]);
        expect(parsed).toEqual(CONFIG);
    });

    it('round-trips through serialize -> parse unchanged', () => {
        expect(parseCupConfig(serializeCupConfig(CONFIG))).toEqual(CONFIG);
    });
});
