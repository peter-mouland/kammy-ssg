/**
 * Test fixtures for transfer validator tests.
 * Kept in this file so each validator test imports from one place.
 */
import type { GameWeekData } from '../../../_shared/lib/fpl/fpl-types';
import { createEmptyPoints, createEmptyStats } from '../../../_shared/lib/roster-conversion-utils';
import type { EnhancedPlayerData } from '../../../scoring/types/scoring-types';
import type { RosterByManagerId, TeamPositionSlot, TeamRoster } from '../../../teams/types/team-types';
import type { TransferRuleContext } from '../../types/transfer-rule-types';
import type { ProcessedTransfer, TransferType } from '../../types/transfer-types';

// ---------------------------------------------------------------------------
// Players
// ---------------------------------------------------------------------------

export function makePlayer(
    overrides: Partial<EnhancedPlayerData> & { position?: EnhancedPlayerData['draft']['position'] },
): EnhancedPlayerData {
    const position = overrides.position ?? 'mid';
    return {
        id: overrides.id ?? 1,
        code: overrides.code ?? 1,
        first_name: 'Test',
        second_name: 'Player',
        web_name: overrides.web_name ?? 'T.Player',
        team_code: overrides.team_code ?? 10,
        draft: {
            position,
            pointsTotal: 0,
            pointsBreakdown: {} as EnhancedPlayerData['draft']['pointsBreakdown'],
            isHidden: false,
            isNew: false,
        },
        ...overrides,
    };
}

// A set of distinct players used across tests — MGR1's players
export const PLAYER_GK = makePlayer({ id: 1, code: 101, web_name: 'Keeper', position: 'gk', team_code: 10 });
export const PLAYER_CB1 = makePlayer({ id: 2, code: 102, web_name: 'CentreBack1', position: 'cb', team_code: 11 });
export const PLAYER_CB2 = makePlayer({ id: 3, code: 103, web_name: 'CentreBack2', position: 'cb', team_code: 12 });
export const PLAYER_FB1 = makePlayer({ id: 4, code: 104, web_name: 'FullBack1', position: 'fb', team_code: 13 });
export const PLAYER_FB2 = makePlayer({ id: 5, code: 105, web_name: 'FullBack2', position: 'fb', team_code: 14 });
export const PLAYER_MID1 = makePlayer({ id: 6, code: 106, web_name: 'Mid1', position: 'mid', team_code: 15 });
export const PLAYER_MID2 = makePlayer({ id: 7, code: 107, web_name: 'Mid2', position: 'mid', team_code: 16 });
export const PLAYER_WA1 = makePlayer({ id: 8, code: 108, web_name: 'WideAtt1', position: 'wa', team_code: 17 });
export const PLAYER_WA2 = makePlayer({ id: 9, code: 109, web_name: 'WideAtt2', position: 'wa', team_code: 18 });
export const PLAYER_CA1 = makePlayer({ id: 10, code: 110, web_name: 'CentreAtt1', position: 'ca', team_code: 19 });
export const PLAYER_CA2 = makePlayer({ id: 11, code: 111, web_name: 'CentreAtt2', position: 'ca', team_code: 20 });
export const PLAYER_SUB = makePlayer({ id: 12, code: 112, web_name: 'Sub', position: 'mid', team_code: 21 });

// MGR2's distinct players — different codes to prevent ownership map collisions
export const MGR2_GK   = makePlayer({ id: 51, code: 151, web_name: 'Keeper2',      position: 'gk',  team_code: 50 });
export const MGR2_CB1  = makePlayer({ id: 52, code: 152, web_name: 'CB2_1',        position: 'cb',  team_code: 51 });
export const MGR2_CB2  = makePlayer({ id: 53, code: 153, web_name: 'CB2_2',        position: 'cb',  team_code: 52 });
export const MGR2_FB1  = makePlayer({ id: 54, code: 154, web_name: 'FB2_1',        position: 'fb',  team_code: 53 });
export const MGR2_FB2  = makePlayer({ id: 55, code: 155, web_name: 'FB2_2',        position: 'fb',  team_code: 54 });
export const MGR2_MID1 = makePlayer({ id: 56, code: 156, web_name: 'Mid2_1',       position: 'mid', team_code: 55 });
export const MGR2_MID2 = makePlayer({ id: 57, code: 157, web_name: 'Mid2_2',       position: 'mid', team_code: 56 });
export const MGR2_WA1  = makePlayer({ id: 58, code: 158, web_name: 'WideAtt2_1',   position: 'wa',  team_code: 57 });
export const MGR2_WA2  = makePlayer({ id: 59, code: 159, web_name: 'WideAtt2_2',   position: 'wa',  team_code: 58 });
export const MGR2_CA1  = makePlayer({ id: 60, code: 160, web_name: 'CentreAtt2_1', position: 'ca',  team_code: 59 });
export const MGR2_CA2  = makePlayer({ id: 61, code: 161, web_name: 'CentreAtt2_2', position: 'ca',  team_code: 60 });
export const MGR2_SUB  = makePlayer({ id: 62, code: 162, web_name: 'Sub2',         position: 'mid', team_code: 61 });

// Free agents — unowned by anyone
export const PLAYER_FREE_MID = makePlayer({ id: 20, code: 200, web_name: 'FreeMid', position: 'mid', team_code: 22 });
export const PLAYER_FREE_CB  = makePlayer({ id: 21, code: 201, web_name: 'FreeCB',  position: 'cb',  team_code: 23 });
export const PLAYER_FREE_GK  = makePlayer({ id: 22, code: 202, web_name: 'FreeGK',  position: 'gk',  team_code: 24 });

// ---------------------------------------------------------------------------
// Roster helpers
// ---------------------------------------------------------------------------

function makeSlot(player: EnhancedPlayerData, teamPosition: string, slotIndex: number, isSub = false): TeamPositionSlot {
    return {
        player: {
            playerId: player.id,
            playerCode: player.code,
            playerName: player.web_name,
            playerPosition: player.draft.position,
            teamPosition: teamPosition as TeamPositionSlot['player']['teamPosition'],
            teamSlotIndex: slotIndex,
            isSub,
            onLoanTo: null,
            onLoanFrom: null,
            onLoanStart: null,
            assignedAt: new Date().toISOString(),
        },
        gameweek: { stats: createEmptyStats(), points: createEmptyPoints() },
        season: { stats: createEmptyStats(), points: createEmptyPoints(), seasonUpToGameweek: 0, seasonGeneratedOn: '' },
    };
}

/**
 * A standard full roster for manager "mgr1".
 * Uses 12 distinct players across all slots.
 */
export function makeStandardRoster(): TeamRoster {
    return {
        gk_0: makeSlot(PLAYER_GK, 'gk', 0),
        cb_0: makeSlot(PLAYER_CB1, 'cb', 0),
        cb_1: makeSlot(PLAYER_CB2, 'cb', 1),
        fb_0: makeSlot(PLAYER_FB1, 'fb', 0),
        fb_1: makeSlot(PLAYER_FB2, 'fb', 1),
        mid_0: makeSlot(PLAYER_MID1, 'mid', 0),
        mid_1: makeSlot(PLAYER_MID2, 'mid', 1),
        wa_0: makeSlot(PLAYER_WA1, 'wa', 0),
        wa_1: makeSlot(PLAYER_WA2, 'wa', 1),
        ca_0: makeSlot(PLAYER_CA1, 'ca', 0),
        ca_1: makeSlot(PLAYER_CA2, 'ca', 1),
        sub_0: makeSlot(PLAYER_SUB, 'sub', 0, true),
        on_loan_0: { ...makeSlot(PLAYER_GK, 'on_loan', 0), player: { ...makeSlot(PLAYER_GK, 'on_loan', 0).player, playerCode: 0 } },
    };
}

/** Distinct roster for MGR2 — no shared player codes with MGR1 */
export function makeMgr2Roster(): TeamRoster {
    return {
        gk_0: makeSlot(MGR2_GK,   'gk',  0),
        cb_0: makeSlot(MGR2_CB1,  'cb',  0),
        cb_1: makeSlot(MGR2_CB2,  'cb',  1),
        fb_0: makeSlot(MGR2_FB1,  'fb',  0),
        fb_1: makeSlot(MGR2_FB2,  'fb',  1),
        mid_0: makeSlot(MGR2_MID1, 'mid', 0),
        mid_1: makeSlot(MGR2_MID2, 'mid', 1),
        wa_0: makeSlot(MGR2_WA1,  'wa',  0),
        wa_1: makeSlot(MGR2_WA2,  'wa',  1),
        ca_0: makeSlot(MGR2_CA1,  'ca',  0),
        ca_1: makeSlot(MGR2_CA2,  'ca',  1),
        sub_0: makeSlot(MGR2_SUB,  'sub', 0, true),
        on_loan_0: { ...makeSlot(MGR2_GK, 'on_loan', 0), player: { ...makeSlot(MGR2_GK, 'on_loan', 0).player, playerCode: 0 } },
    };
}

/** Roster with on_loan_0 already occupied */
export function makeRosterWithLoanOut(loanedOutPlayer: EnhancedPlayerData, toManagerId: string): TeamRoster {
    const roster = makeStandardRoster();
    roster.on_loan_0 = {
        ...makeSlot(loanedOutPlayer, 'on_loan', 0),
        player: {
            ...makeSlot(loanedOutPlayer, 'on_loan', 0).player,
            onLoanTo: toManagerId,
        },
    };
    return roster;
}

// ---------------------------------------------------------------------------
// Division rosters
// ---------------------------------------------------------------------------

export const MGR1 = 'mgr1';
export const MGR2 = 'mgr2';

export function makeDivisionRosters(mgr1Roster = makeStandardRoster()): RosterByManagerId {
    return {
        [MGR1]: { roster: mgr1Roster },
        [MGR2]: { roster: makeMgr2Roster() },
    };
}

// ---------------------------------------------------------------------------
// Gameweek
// ---------------------------------------------------------------------------

export function makeGameweek(id = 5): GameWeekData {
    return {
        fplEvent: {
            id,
            name: `Gameweek ${id}`,
            deadline_time: new Date().toISOString(),
            finished: false,
            is_current: true,
            is_next: false,
            is_previous: false,
            average_entry_score: 0,
            data_checked: false,
            highest_score: 0,
            highest_scoring_entry: 0,
        },
    } as GameWeekData;
}

// ---------------------------------------------------------------------------
// Transfer builder
// ---------------------------------------------------------------------------

export function makeTransfer(
    overrides: Partial<ProcessedTransfer> & {
        transferType: TransferType;
        playerIn: EnhancedPlayerData;
        playerOut: EnhancedPlayerData;
    },
): ProcessedTransfer {
    return {
        id: 'transfer-1',
        status: 'PENDING',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        managerId: MGR1,
        comment: '',
        gameweekData: makeGameweek(),
        onLoanTo: undefined,
        onLoanFrom: undefined,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Context builder
// ---------------------------------------------------------------------------

export function makeContext(
    transfer: ProcessedTransfer,
    overrides: Partial<TransferRuleContext> = {},
): TransferRuleContext {
    const fplPlayersByCode: Record<number, EnhancedPlayerData> = {};
    const allPlayers = [
        PLAYER_GK, PLAYER_CB1, PLAYER_CB2, PLAYER_FB1, PLAYER_FB2,
        PLAYER_MID1, PLAYER_MID2, PLAYER_WA1, PLAYER_WA2, PLAYER_CA1,
        PLAYER_CA2, PLAYER_SUB,
        MGR2_GK, MGR2_CB1, MGR2_CB2, MGR2_FB1, MGR2_FB2,
        MGR2_MID1, MGR2_MID2, MGR2_WA1, MGR2_WA2, MGR2_CA1,
        MGR2_CA2, MGR2_SUB,
        PLAYER_FREE_MID, PLAYER_FREE_CB, PLAYER_FREE_GK,
    ];
    for (const p of allPlayers) fplPlayersByCode[p.code] = p;
    // code=0 is the "empty loan slot" sentinel used by makeStandardRoster — map it so validators
    // that do fplPlayersByCode[slot.player.playerCode] don't crash on an unoccupied on_loan_0
    fplPlayersByCode[0] = makePlayer({ id: 0, code: 0, web_name: 'Empty', position: 'gk', team_code: 0 });

    return {
        transfer,
        allGameweekTransfers: [],
        divisionRosters: makeDivisionRosters(),
        gameweekData: makeGameweek(),
        fplPlayersByCode,
        divisionId: 'premierLeague',
        currentGameweek: 5,
        ...overrides,
    };
}
