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

interface DefenderRules extends BasePositionRules {
    goalsConcededPenalty: number;
}

interface CenterBackRules extends DefenderRules {
    bonus: number;
}

interface MidfielderRules extends BasePositionRules {
    bonus: number;
}

interface AttackerRules extends BasePositionRules {}

type PositionRules = {
    gk: GoalkeeperRules;
    fb: DefenderRules;
    cb: CenterBackRules;
    mid: MidfielderRules;
    wa: AttackerRules;
    ca: AttackerRules;
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
        goalsConcededPenalty: -1, // per 2 goals,
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
        goalsConcededPenalty: -1, // per 2 goals,
        yellowCard: -1,
        redCardPenalty: -3,
        appearance: {
            under45Min: 1,
            over45Min: 3,
        },
    },
    cb: {
        goalPoints: 8,
        assists: 3,
        cleanSheetPoints: 5,
        goalsConcededPenalty: -1, // per 2 goals,
        yellowCard: -1,
        redCardPenalty: -3,
        bonus: 1,
        appearance: {
            under45Min: 1,
            over45Min: 3,
        },
    },
    mid: {
        goalPoints: 5,
        bonus: 1,
        cleanSheetPoints: 3,
        redCardPenalty: -5,
        assists: 3,
        yellowCard: -1,
        appearance: {
            under45Min: 1,
            over45Min: 3,
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
