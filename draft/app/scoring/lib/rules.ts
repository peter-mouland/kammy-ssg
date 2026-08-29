/* Location: app/scoring/lib/rules.ts */
interface AppearanceRules {
    under45Min: number;
    over45Min: number;
}
interface DefensiveContributionRules {
    threshold: number;
    points: number;
}

interface BasePositionRules {
    goalPoints: number;
    assists: number;
    cleanSheetPoints: number;
    yellowCard: number;
    redCardPenalty: number;
    appearance: AppearanceRules;
}

interface GoalkeeperRules extends BasePositionRules {
    savesThreshold: number;
    savesRatio: number;
    penaltiesSaved: number;
    goalsConcededPenalty: number;
}

interface FallBackRules extends BasePositionRules {
    goalsConcededPenalty: number;
    defensiveContribution: DefensiveContributionRules;
}

interface CenterBackRules extends BasePositionRules {
    goalsConcededPenalty: number;
    defensiveContribution: DefensiveContributionRules;
}

interface MidfielderRules extends BasePositionRules {
    defensiveContribution: DefensiveContributionRules;
}

type PositionRules = {
    gk: GoalkeeperRules;
    fb: FallBackRules;
    cb: CenterBackRules;
    mid: MidfielderRules;
    wa: BasePositionRules;
    ca: BasePositionRules;
};

// Position point multipliers and rules
export const POSITION_RULES: PositionRules = {
    gk: {
        goalPoints: 10,
        assists: 3,
        cleanSheetPoints: 5,
        savesThreshold: 2,
        savesRatio: 3, // 1 point per 3 saves after threshold
        penaltiesSaved: 5,
        goalsConcededPenalty: -1, // <=1 goal conceded : 0 points // 2nd goal conceded : -1 points etc...
        yellowCard: -1,
        redCardPenalty: -3,
        appearance: {
            under45Min: 1,
            over45Min: 3,
        },
    },
    fb: {
        goalPoints: 8,
        assists: 3,
        cleanSheetPoints: 5,
        goalsConcededPenalty: -1, // <=1 goal conceded : 0 points // 2nd goal conceded : -1 points etc...
        yellowCard: -1,
        redCardPenalty: -3,
        appearance: {
            under45Min: 1,
            over45Min: 3,
        },
        defensiveContribution: {
            points: 1,
            threshold: 10,
        },
    },
    cb: {
        goalPoints: 8,
        assists: 3,
        cleanSheetPoints: 5,
        goalsConcededPenalty: -1, // <=1 goal conceded : 0 points // 2nd goal conceded : -1 points etc...
        yellowCard: -1,
        redCardPenalty: -3,
        appearance: {
            under45Min: 1,
            over45Min: 3,
        },
        defensiveContribution: {
            points: 1,
            threshold: 10,
        },
    },
    mid: {
        goalPoints: 4,
        cleanSheetPoints: 2,
        redCardPenalty: -5,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3,
        },
        defensiveContribution: {
            points: 2,
            threshold: 12,
        },
    },
    wa: {
        goalPoints: 4,
        cleanSheetPoints: 0,
        redCardPenalty: -5,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3,
        },
    },
    ca: {
        goalPoints: 4,
        cleanSheetPoints: 0,
        redCardPenalty: -5,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3,
        },
    },
} as const;
