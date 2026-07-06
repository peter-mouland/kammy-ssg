/* Location: app/cup/lib/cup-config.ts */

import type { CupConfig, CupRound, CupStageId } from '../types/cup-types';
import { CUP_STAGES } from './cup-rules';

const TWO_LEGGED_STAGES = ['r16', 'qf', 'sf'] as const;

/**
 * Expand an admin CupConfig into the ordered list of concrete rounds, one per
 * gameweek played. This is the bridge between "which gameweek is which stage"
 * (config) and everything that keys off a single gameweek.
 */
export function resolveCupRounds(config: CupConfig): CupRound[] {
    const rounds: CupRound[] = [];

    for (const gameweek of config.league) {
        rounds.push({
            stage: 'league',
            leg: 1,
            gameweek,
            playersRequired: CUP_STAGES.league.playersRequired,
            twoLegged: false,
        });
    }

    for (const stage of TWO_LEGGED_STAGES) {
        const [leg1, leg2] = config[stage];
        rounds.push({
            stage,
            leg: 1,
            gameweek: leg1,
            playersRequired: CUP_STAGES[stage].playersRequired,
            twoLegged: true,
        });
        rounds.push({
            stage,
            leg: 2,
            gameweek: leg2,
            playersRequired: CUP_STAGES[stage].playersRequired,
            twoLegged: true,
        });
    }

    rounds.push({
        stage: 'final',
        leg: 1,
        gameweek: config.final,
        playersRequired: CUP_STAGES.final.playersRequired,
        twoLegged: false,
    });

    return rounds;
}

/** The round (stage + leg) played in a given gameweek, if any. */
export function getRoundForGameweek(config: CupConfig, gameweek: number): CupRound | null {
    return resolveCupRounds(config).find((round) => round.gameweek === gameweek) ?? null;
}

/** The gameweek a given stage/leg is played in, if configured. */
export function getGameweekForStage(config: CupConfig, stage: CupStageId, leg = 1): number | null {
    const round = resolveCupRounds(config).find((r) => r.stage === stage && r.leg === leg);
    return round ? round.gameweek : null;
}

/**
 * Config is stored in the sheet as simple key/value rows so an admin can edit
 * it by hand if needed. These pure helpers convert between that flat form and
 * the typed CupConfig, and are unit-tested independently of the sheet client.
 */
export interface CupConfigRow {
    key: string;
    value: string;
}

function parseGameweekList(value: string): number[] {
    return value
        .split(',')
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((n) => !Number.isNaN(n));
}

function parseLeggedPair(value: string): [number, number] {
    const gameweeks = parseGameweekList(value);
    return [gameweeks[0] ?? Number.NaN, gameweeks[1] ?? Number.NaN];
}

export function parseCupConfig(rows: CupConfigRow[]): CupConfig {
    const byKey = new Map(rows.map((row) => [row.key.trim().toLowerCase(), row.value]));
    const get = (key: string): string => byKey.get(key) ?? '';

    return {
        season: get('season'),
        league: parseGameweekList(get('league')),
        r16: parseLeggedPair(get('r16')),
        qf: parseLeggedPair(get('qf')),
        sf: parseLeggedPair(get('sf')),
        final: Number.parseInt(get('final').trim(), 10),
    };
}

export function serializeCupConfig(config: CupConfig): CupConfigRow[] {
    return [
        { key: 'season', value: config.season },
        { key: 'league', value: config.league.join(',') },
        { key: 'r16', value: config.r16.join(',') },
        { key: 'qf', value: config.qf.join(',') },
        { key: 'sf', value: config.sf.join(',') },
        { key: 'final', value: String(config.final) },
    ];
}
