/* Location: app/cup/types/cup-types.ts */
/** biome-ignore-all lint/style/useNamingConvention: sheet-header property names mirror the Cup sheet columns */

/**
 * The cup runs a league stage that seeds a two-legged knockout.
 * Stage ids are stable keys used across config, submissions and the bracket.
 */
import type { DivisionId, ManagerId } from '../../_shared/types/league-types';
export type CupStageId = 'league' | 'r16' | 'qf' | 'sf' | 'final';

/**
 * The fixed shape of a stage — how many players a manager picks and whether
 * the tie is played over two legs. This is rules, not configuration; the
 * gameweeks a stage is played in are configured separately (see CupConfig).
 */
export interface CupStageShape {
    id: CupStageId;
    label: string;
    playersRequired: number;
    twoLegged: boolean;
}

/**
 * Admin-configured mapping of cup stages to FPL gameweek ids. This is the
 * single source of truth for "which gameweek is which stage" and everything
 * else (deadlines, submission windows, visibility, scoring) derives from it.
 * Stored in the Cup config sheet and edited from the admin panel.
 */
export interface CupConfig {
    season: string;
    league: number[]; // league-stage gameweek ids, in order
    r16: [number, number]; // [leg 1 gameweek, leg 2 gameweek]
    qf: [number, number];
    sf: [number, number];
    final: number; // single-leg gameweek
}

/**
 * A resolved (stage, leg) unit mapped to a concrete FPL gameweek — the
 * flattened form of CupConfig used by loaders and the submission UI.
 */
export interface CupRound {
    stage: CupStageId;
    leg: number; // 1-based; always 1 for single-leg stages
    gameweek: number; // FPL gameweek id
    playersRequired: number;
    twoLegged: boolean;
}

/**
 * Confirmation state of a submission. A team is only revealed publicly once
 * its subs are CONFIRMED (mirrors the transfer approval flow), never while
 * PENDING — even after the deadline has passed.
 */
export type CupSubmissionStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

/** Raw Cup submissions sheet row (header text -> cell value). */
export interface CupSheetData {
    Status: string; // '' = pending, 'Y' = confirmed, 'N' = rejected
    Timestamp: string | number | Date;
    Manager: string;
    Division: string;
    Gameweek: string | number;
    Stage: string;
    Leg: string | number;
    Players: string; // comma-separated player codes
    SubmittedByAdmin: string | boolean;
    AdminReason: string;
}

/** Normalised sheet row after parsing/transform. */
export interface ProcessedCupSheetData {
    status: string;
    timestamp: Date;
    manager: ManagerId;
    division: DivisionId;
    gameweek: number;
    stage: CupStageId;
    leg: number;
    players: number[];
    submittedByAdmin: boolean;
    adminReason: string;
}

/** A manager's team submission for one cup round (one gameweek/leg). */
export interface CupSubmission {
    id: string;
    manager: ManagerId;
    division: DivisionId;
    gameweek: number;
    stage: CupStageId;
    leg: number;
    players: number[]; // player codes
    submittedByAdmin: boolean;
    adminReason?: string;
    status: CupSubmissionStatus;
    timestamp: Date;
}

/** A single knockout tie within a stage. */
export interface CupMatchup {
    stage: CupStageId;
    tie: number; // index of the tie within the stage
    home: ManagerId | null;
    away: ManagerId | null;
    homeAggregate?: number;
    awayAggregate?: number;
    winner?: ManagerId | null;
}
