const { positions, getPositionLabel } = require('./positions');

const INITIAL_POINTS = positions.reduce((prev, pos) => (
  {
    ...prev,
    [pos.key]: { gameWeekStats: 0, seasonStats: 0 },
  }
), {});

const getTotal = (posPoints = {}) => (
  (Object.keys(posPoints).reduce((prev, pos) => ({
    gameWeekStats: prev.gameWeekStats + posPoints[pos].gameWeekStats,
    seasonStats: prev.seasonStats + posPoints[pos].seasonStats,
  }), {
    gameWeekStats: 0, seasonStats: 0,
  }))
);

const getPoints = (team = []) => {
  const posPoints = team
    .reduce((prev, { gameWeekStats, seasonToGameWeek, teamPos }) => {
      const key = (getPositionLabel(teamPos) || {}).key;
      const gameWeek = prev[key] ? prev[key].gameWeekStats + gameWeekStats.points : gameWeekStats.points;
      const season = prev[key] ? prev[key].seasonStats + seasonToGameWeek.points : seasonToGameWeek.points;
      return {
        ...prev,
        [key]: {
          gameWeekStats: gameWeek,
          seasonStats: season,
        },
      };
    }, INITIAL_POINTS);
  return {
    ...posPoints,
    total: getTotal(posPoints),
  };
};

module.exports = getPoints;
