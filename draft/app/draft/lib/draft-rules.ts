// lib/draft/draft-rules.ts - Clean version with ONLY fixed existing functions
import { useMemo } from 'react';

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
    [teamCode: number]: {
        count: number;
        teamName: string;
    };
}

// Get player position from draft.position (our custom positions)
export const getPlayerPosition = (player: any): string => {
    return (player.position || player.draft?.position)?.toLowerCase() || 'unknown';  // userPicks uses player.position. targetPlayer uses draft.position
};

// Calculate current squad composition (regular function) - FIXED
export function getSquadComposition(userPicks: any[]) {
    const positionCounts: PositionCounts = {
        gk: 0, cb: 0, fb: 0, mid: 0, wa: 0, ca: 0, sub: 0, total: 0
    };

    const teamCounts: TeamCounts = {};

    // Track which players go to main positions vs substitutes
    const positionTracker: Record<string, number> = {
        gk: 0, cb: 0, fb: 0, mid: 0, wa: 0, ca: 0
    };

    userPicks.forEach(pick => {
        const position = getPlayerPosition(pick);

        // Count team occurrences
        const teamCode = pick.teamCode;
        if (!teamCounts[teamCode]) {
            teamCounts[teamCode] = { count: 0, teamName: pick.teamName };
        }
        teamCounts[teamCode].count++;

        // Count positions properly - main squad vs substitutes
        if (position in DRAFT_RULES.positions && position !== 'unknown') {
            const positionRule = DRAFT_RULES.positions[position as keyof typeof DRAFT_RULES.positions];
            const currentInPosition = positionTracker[position] || 0;

            if (currentInPosition < positionRule.max) {
                // Goes to main position
                positionCounts[position as keyof PositionCounts]++;
                positionTracker[position] = currentInPosition + 1;
            } else {
                // Goes to substitute
                positionCounts.sub++;
            }
        }

        positionCounts.total++;
    });

    return { positionCounts, teamCounts };
}

// Hook version (for React components that need memoization)
export function useSquadComposition(userPicks: any[]) {
    return useMemo(() => getSquadComposition(userPicks), [userPicks]);
}

// Function to validate if a player can be drafted - FIXED
export function validateDraftEligibility(squadComposition: any, targetPlayer: any): DraftValidationResult {
    if (!targetPlayer) {
        return { isEligible: false, violations: ['No player selected'], canAddToSub: false };
    }

    const playerPosition = getPlayerPosition(targetPlayer);
    if (playerPosition === 'unknown') {
        return { isEligible: false, violations: ['Player has no position'], canAddToSub: false };
    }

    const violations: string[] = [];
    const playerTeamCode = targetPlayer.team_code;

    // Check squad size limit FIRST
    if (squadComposition.positionCounts.total >= DRAFT_RULES.totalSquadSize) {
        return { isEligible: false, violations: ['Squad is full (12 players)'], canAddToSub: false };
    }

    // Check team limit - THIS IS A HARD BLOCK
    const currentTeamCount = squadComposition.teamCounts[playerTeamCode]?.count || 0;
    if (currentTeamCount >= DRAFT_RULES.maxPlayersPerTeam) {
        const teamName = squadComposition.teamCounts[playerTeamCode]?.teamName;
        return {
            isEligible: false,
            violations: [`Already have ${DRAFT_RULES.maxPlayersPerTeam} players from ${teamName}`],
            canAddToSub: false
        };
    }

    // Check position limits
    const positionRule = DRAFT_RULES.positions[playerPosition as keyof typeof DRAFT_RULES.positions];
    if (!positionRule) {
        return { isEligible: false, violations: [`Unknown position: ${playerPosition}`], canAddToSub: false };
    }

    const currentPositionCount = squadComposition.positionCounts[playerPosition as keyof PositionCounts] || 0;
    const currentSubCount = squadComposition.positionCounts.sub || 0;

    // Can this player go to main position?
    const canAddToPosition = currentPositionCount < positionRule.max;

    // Can this player go to substitute?
    const canAddToSub = currentSubCount < DRAFT_RULES.maxSubstitutes;

    // FIXED: Check if this would be the 4th+ player of this position
    // We can only have: main positions (max) + 1 substitute per position type
    if (currentPositionCount >= positionRule.max && currentSubCount > 0) {
        // Position is full AND we already have a substitute
        return {
            isEligible: false,
            violations: [
                `Cannot add more ${positionRule.name}s - already have ${currentPositionCount} and 1 substitute`
            ],
            canAddToSub: false
        };
    }

    // FIXED: If position is full and no substitute slots available, block entirely
    if (currentPositionCount >= positionRule.max && !canAddToSub) {
        return {
            isEligible: false,
            violations: [
                `Already have ${positionRule.max} ${positionRule.name}${positionRule.max > 1 ? 's' : ''}`,
                `No substitute slots available (${currentSubCount}/${DRAFT_RULES.maxSubstitutes})`
            ],
            canAddToSub: false
        };
    }

    // Add violations for display (but player is still eligible)
    if (!canAddToPosition) {
        violations.push(`Already have ${positionRule.max} ${positionRule.name}${positionRule.max > 1 ? 's' : ''}`);
    }
    if (!canAddToSub && !canAddToPosition) {
        violations.push(`Already have ${DRAFT_RULES.maxSubstitutes} substitute`);
    }

    // Player is eligible if they can go to main position OR substitute
    const isEligible = canAddToPosition || canAddToSub;

    return {
        isEligible,
        violations,
        canAddToSub: canAddToSub && !canAddToPosition
    };
}

// Get eligible players (regular function)
export function getEligiblePlayers(allPlayers: any[], userPicks: any[]) {
    const squadComposition = getSquadComposition(userPicks);

    if (squadComposition.positionCounts.total >= DRAFT_RULES.totalSquadSize) {
        return { eligiblePlayers: [], hiddenCount: allPlayers.length, violations: ['Squad is full'] };
    }

    const eligiblePlayers: any[] = [];
    const violations = new Set<string>();

    allPlayers.forEach(player => {
        const validation = validateDraftEligibility(squadComposition, player);

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

// Hook version (for React components that need memoization)
export function useEligiblePlayers(allPlayers: any[], userPicks: any[]) {
    return useMemo(() => getEligiblePlayers(allPlayers, userPicks), [allPlayers, userPicks]);
}
