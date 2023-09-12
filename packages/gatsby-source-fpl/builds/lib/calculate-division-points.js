const { positions, getPosition } = require('./positions');

const INITIAL_POINTS = positions.reduce(
    (prev, pos) => ({
        ...prev,
        [pos.category]: { gameWeekPoints: 0, seasonPoints: 0 },
    }),
    {},
);

const getTotal = (posPoints = {}) =>
    Object.keys(posPoints).reduce(
        (prev, pos) => ({
            gameWeekPoints: prev.gameWeekPoints + posPoints[pos].gameWeekPoints,
            seasonPoints: prev.seasonPoints + posPoints[pos].seasonPoints,
        }),
        {
            gameWeekPoints: 0,
            seasonPoints: 0,
        },
    );

const getPoints = (team = []) => {
    const posPoints = team.reduce((prev, { gameWeekStats = {}, seasonToGameWeek = {}, squadPositionId }) => {
        const { category } = getPosition(squadPositionId);
        const gameWeek = prev[category] ? prev[category].gameWeekPoints + gameWeekStats.points : gameWeekStats.points;
        const season = prev[category] ? prev[category].seasonPoints + seasonToGameWeek.points : seasonToGameWeek.points;
        return {
            ...prev,
            [category]: {
                gameWeekPoints: gameWeek,
                seasonPoints: season,
            },
        };
    }, INITIAL_POINTS);
    return {
        ...posPoints,
        total: getTotal(posPoints),
    };
};

module.exports = getPoints;
