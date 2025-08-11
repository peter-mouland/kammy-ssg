/* Location: app/scoring/lib/rules.ts */
interface AppearanceRules {
    under45Min: number;
    over45Min: number;
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
    defensiveContribution: number;
}

interface CenterBackRules extends BasePositionRules {
    goalsConcededPenalty: number;
    bonus: number;
    defensiveContribution: number;
}

interface MidfielderRules extends BasePositionRules {
    bonus: number;
    defensiveContribution: number;
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
        defensiveContribution: 1,
    },
    cb: {
        goalPoints: 8,
        assists: 3,
        cleanSheetPoints: 5,
        goalsConcededPenalty: -1, // <=1 goal conceded : 0 points // 2nd goal conceded : -1 points etc...
        yellowCard: -1,
        redCardPenalty: -3,
        bonus: 1,
        appearance: {
            under45Min: 1,
            over45Min: 3,
        },
        defensiveContribution: 1,
    },
    mid: {
        goalPoints: 4,
        bonus: 1,
        cleanSheetPoints: 2,
        redCardPenalty: -5,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3,
        },
        defensiveContribution: 2,
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
