// lib/draft/draft-rules.ts - Fixed validation logic
import * as React from 'react';

// Draft rules configuration
export const DRAFT_RULES = {
    positions: {
        gk: { max: 1, name: 'Goalkeeper' },
        cb: { max: 2, name: 'Centre Back' },
        fb: { max: 2, name: 'Full Back' },
        mid: { max: 2, name: 'Midfielder' },
        wa: { max: 2, name: 'Wide Attacker' },
        ca: { max: 2, name: 'Centre Attacker' }
    },
    maxPlayersPerTeam: 2,
    maxSubstitutes: 1,
    totalSquadSize: 12
};

export interface DraftValidationResult {
    isEligible: boolean;
    violations: string[];
    canAddToSub: boolean;
}

export interface PositionCounts {
    gk: number;
    cb: number;
    fb: number;
    mid: number;
    wa: number;
    ca: number;
    sub: number;
    total: number;
}

export interface TeamCounts {
    [teamId: number]: {
        count: number;
        teamName: string;
    };
}

// Get player position from draft.position (our custom positions)
export const getPlayerPosition = (player: any): string => {
    return player.draft?.position?.toLowerCase() || 'unknown';
};

// Hook to calculate current squad composition
export function useSquadComposition(userPicks: any[]) {
        const positionCounts: PositionCounts = {
            gk: 0, cb: 0, fb: 0, mid: 0, wa: 0, ca: 0, sub: 0, total: 0
        };

        const teamCounts: TeamCounts = {};

        userPicks.forEach(pick => {
            const position = getPlayerPosition(pick);

            // Count main positions
            if (position in positionCounts && position !== 'sub') {
                positionCounts[position as keyof Omit<PositionCounts, 'sub' | 'total'>]++;
            }

            // Count team occurrences
            const teamId = pick.team || pick.teamId;
            if (teamId) {
                if (!teamCounts[teamId]) {
                    teamCounts[teamId] = { count: 0, teamName: `Team ${teamId}` };
                }
                teamCounts[teamId].count++;
            }

            positionCounts.total++;
        });

        // Calculate substitute count (players beyond position limits)
        const mainPositionTotal = Object.entries(DRAFT_RULES.positions)
            .reduce((sum, [pos, rule]) => sum + Math.min(positionCounts[pos as keyof PositionCounts], rule.max), 0);

        positionCounts.sub = positionCounts.total - mainPositionTotal;

        return { positionCounts, teamCounts };
}

// Function to validate if a player can be drafted - FIXED LOGIC
export function validateDraftEligibility(userPicks: any[], targetPlayer: any): DraftValidationResult {
    if (!targetPlayer) {
        return { isEligible: false, violations: ['No player selected'], canAddToSub: false };
    }

    // Calculate current squad composition
    const { positionCounts, teamCounts } = useSquadComposition(userPicks);

    const violations: string[] = [];
    const playerPosition = getPlayerPosition(targetPlayer);
    const playerTeamId = targetPlayer.team || targetPlayer.teamId;

    // Check squad size limit FIRST
    if (positionCounts.total >= DRAFT_RULES.totalSquadSize) {
        return { isEligible: false, violations: ['Squad is full (12 players)'], canAddToSub: false };
    }

    // Check team limit - THIS IS A HARD BLOCK
    const currentTeamCount = teamCounts[playerTeamId]?.count || 0;
    if (currentTeamCount >= DRAFT_RULES.maxPlayersPerTeam) {
        const teamName = teamCounts[playerTeamId]?.teamName || `Team ${playerTeamId}`;
        return {
            isEligible: false,
            violations: [`Already have ${DRAFT_RULES.maxPlayersPerTeam} players from ${teamName}`],
            canAddToSub: false
        };
    }

    // Check position limits
    const positionRule = DRAFT_RULES.positions[playerPosition as keyof typeof DRAFT_RULES.positions];
    const currentPositionCount = positionCounts[playerPosition as keyof PositionCounts] || 0;

    let canAddToPosition = false;
    let canAddToSub = false;

    if (positionRule) {
        // Can add to main position if under limit
        canAddToPosition = currentPositionCount < positionRule.max;

        if (!canAddToPosition) {
            violations.push(`Already have ${positionRule.max} ${positionRule.name}${positionRule.max > 1 ? 's' : ''}`);
        }
    } else {
        violations.push(`Unknown player position: ${playerPosition}`);
    }

    // Check if can add to substitute (only if position is full but team limit OK)
    if (!canAddToPosition && violations.length > 0) {
        canAddToSub = positionCounts.sub < DRAFT_RULES.maxSubstitutes;

        if (!canAddToSub) {
            violations.push(`Already have ${DRAFT_RULES.maxSubstitutes} substitute`);
        }
    }

    // Player is eligible if they can go to main position OR substitute (and no team violations)
    const isEligible = (canAddToPosition || canAddToSub) && violations.filter(v => !v.includes('Already have')).length === 0;

    return { isEligible, violations, canAddToSub };
}

// Hook to filter eligible players for the draft
export function useEligiblePlayers(allPlayers: any[], userPicks: any[]) {
        const { positionCounts } = useSquadComposition(userPicks);

        if (positionCounts.total >= DRAFT_RULES.totalSquadSize) {
            return { eligiblePlayers: [], hiddenCount: allPlayers.length, violations: ['Squad is full'] };
        }

        const eligiblePlayers: any[] = [];
        const violations = new Set<string>();

        allPlayers.forEach(player => {
            const validation = validateDraftEligibility(userPicks, player);

            if (validation.isEligible) {
                eligiblePlayers.push(player);
            } else {
                validation.violations.forEach(v => violations.add(v));
            }
        });

        return {
            eligiblePlayers,
            hiddenCount: allPlayers.length - eligiblePlayers.length,
            violations: Array.from(violations)
        };
}
