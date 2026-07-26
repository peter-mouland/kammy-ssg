import { describe, expect, it } from 'vitest';
import {
    makeContext,
    makeDivisionRosters,
    makePlayer,
    makeStandardRoster,
    makeTransfer,
    PLAYER_CB1,
    PLAYER_CB2,
    PLAYER_FREE_CB,
    PLAYER_FREE_MID,
    PLAYER_MID1,
} from './fixtures';
import { teamCountLimit } from './team-count-validator';

describe('teamCountLimit', () => {
    it('passes when playerIn is from a team not yet in the roster', () => {
        // PLAYER_FREE_MID has team_code 22 — not in the standard roster
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_MID, playerOut: PLAYER_MID1 });
        const result = teamCountLimit(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('passes when playerIn brings the team count to exactly 2', () => {
        // One player from PLAYER_FREE_CB's team is already in mid_1. Transferring in PLAYER_FREE_CB
        // brings that team's count to 2 — exactly at the limit, not over.
        const alreadyInRoster = makePlayer({
            id: 99,
            code: 299,
            web_name: 'SameTeam',
            position: 'mid',
            team_code: PLAYER_FREE_CB.team_code,
        });
        const roster = makeStandardRoster();
        roster.mid_1 = { ...roster.mid_1, player: { ...roster.mid_1.player, playerCode: alreadyInRoster.code } };
        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB, playerOut: PLAYER_MID1 });
        const fplPlayersByCode = { ...makeContext(transfer).fplPlayersByCode, [alreadyInRoster.code]: alreadyInRoster };

        const result = teamCountLimit(
            makeContext(transfer, { divisionRosters: makeDivisionRosters(roster), fplPlayersByCode }),
        );
        expect(result.passed).toBe(true);
    });

    it('blocks when playerIn would result in 3 players from the same real-world team', () => {
        // Put two CB1-team players in the roster already
        const sameTeamPlayer = makePlayer({
            id: 30,
            code: 300,
            web_name: 'SameTeam',
            position: 'fb',
            team_code: PLAYER_CB1.team_code,
        });
        const roster = makeStandardRoster();
        roster.fb_0 = { ...roster.fb_0, player: { ...roster.fb_0.player, playerCode: sameTeamPlayer.code } };

        const rosters = makeDivisionRosters(roster);
        const fplPlayersByCode = {
            ...makeContext(makeTransfer({ transferType: 'TRANSFER', playerIn: PLAYER_FREE_CB, playerOut: PLAYER_MID1 }))
                .fplPlayersByCode,
            [sameTeamPlayer.code]: sameTeamPlayer,
        };

        // Now transfer in another player from team_code 11 (CB1's team)
        const anotherSameTeam = makePlayer({
            id: 31,
            code: 301,
            web_name: 'AnotherSameTeam',
            position: 'mid',
            team_code: PLAYER_CB1.team_code,
        });
        fplPlayersByCode[anotherSameTeam.code] = anotherSameTeam;

        const transfer = makeTransfer({ transferType: 'TRANSFER', playerIn: anotherSameTeam, playerOut: PLAYER_MID1 });
        const result = teamCountLimit(makeContext(transfer, { divisionRosters: rosters, fplPlayersByCode }));
        expect(result.passed).toBe(false);
        expect(result.message).toMatch(/Already own 2 players from this team/);
    });

    it('always passes for SWAP regardless of team counts', () => {
        const transfer = makeTransfer({ transferType: 'SWAP', playerIn: PLAYER_CB1, playerOut: PLAYER_CB2 });
        const result = teamCountLimit(makeContext(transfer));
        expect(result.passed).toBe(true);
    });

    it('uses warning severity (not blocking) for LOAN_END team count violations', () => {
        // Build a scenario where a loan end would leave 3 from same team
        const sameTeamPlayer = makePlayer({
            id: 30,
            code: 300,
            web_name: 'SameTeam',
            position: 'fb',
            team_code: PLAYER_CB1.team_code,
        });
        const roster = makeStandardRoster();
        roster.fb_0 = { ...roster.fb_0, player: { ...roster.fb_0.player, playerCode: sameTeamPlayer.code } };

        const rosters = makeDivisionRosters(roster);
        const playerIn = makePlayer({
            id: 31,
            code: 301,
            web_name: 'LoanBack',
            position: 'mid',
            team_code: PLAYER_CB1.team_code,
        });
        const fplPlayersByCode = {
            ...makeContext(makeTransfer({ transferType: 'LOAN_END', playerIn, playerOut: PLAYER_MID1 }))
                .fplPlayersByCode,
            [sameTeamPlayer.code]: sameTeamPlayer,
            [playerIn.code]: playerIn,
        };

        const transfer = makeTransfer({ transferType: 'LOAN_END', playerIn, playerOut: PLAYER_MID1 });
        const result = teamCountLimit(makeContext(transfer, { divisionRosters: rosters, fplPlayersByCode }));
        expect(result.passed).toBe(false);
        expect(result.severity).toBe('warning');
    });
});
