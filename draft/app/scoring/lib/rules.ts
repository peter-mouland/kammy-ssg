// Position point multipliers and rules
export const POSITION_RULES = {
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
            over45Min: 3
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
            over45Min: 3
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
            over45Min: 3
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
            over45Min: 3
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
            over45Min: 3
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
            over45Min: 3
        },
    }
} as const;
