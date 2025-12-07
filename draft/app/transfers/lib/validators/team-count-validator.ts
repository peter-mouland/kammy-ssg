// app/transfers/lib/validators/ownership-validator.ts

import type { RuleValidationResult, TransferRuleContext } from '../../types/transfer-rule-types';

/**
 * Validate loan limits - managers can only have one player on loan at a time
 */
export function teamCountLimit(context: TransferRuleContext): RuleValidationResult {
    const { transfer, divisionRosters, fplPlayersByCode } = context;

    const roster = divisionRosters[transfer.managerId].roster;
    const teams = new Map();
    Object.values(roster).forEach((slot) => {
        const player = fplPlayersByCode[slot.player.playerCode];
        if (!player) {
            console.error('No FPL Player Match: ' + slot.player.playerCode);
            console.error(slot.player);
        }
        teams.set(player.team_code, (teams.get(player.team_code) || 0) + 1);
    });

    // For loan transfers, different rules apply
    if (transfer.transferType === 'SWAP') {
        return {
            ruleId: 'teamCountLimit',
            ruleName: 'Team Count Limit',
            passed: true,
            message: 'Swap can involve any team',
            severity: 'blocking',
        };
    }
    if (transfer.playerOut) teams.set(transfer.playerOut.team_code, teams.get(transfer.playerOut.team_code) - 1);
    if (transfer.playerIn) teams.set(transfer.playerIn.team_code, teams.get(transfer.playerIn.team_code) + 1);
    const newTeamCount = teams.get(transfer.playerIn.team_code);

    if (newTeamCount > 2) {
        return {
            ruleId: 'teamCountLimit',
            ruleName: 'Team Count Limit',
            passed: false,
            message: 'Already own 2 players from this team',
            // loan end issue can be fixed in the very next transfer, so warning is ok
            severity: transfer.transferType === 'LOAN_END' ? 'warning' : 'blocking',
            details: {
                teamCode: transfer.playerIn.team_code,
            },
        };
    }

    return {
        ruleId: 'teamCountLimit',
        ruleName: 'Team Count Limit',
        passed: true,
        severity: 'blocking',
        message: 'teamCountLimit check passed',
    };
}
