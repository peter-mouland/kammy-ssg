const { positions, getPositionLabel } = require('./positions');

const INITIAL_POINTS = positions.reduce((prev, pos) => (
  {
    ...prev,
    [pos.key]: { gameWeekPoints: 0, seasonPoints: 0 },
  }
), {});

const getTotal = (posPoints = {}) => (
  (Object.keys(posPoints).reduce((prev, pos) => ({
    gameWeekPoints: prev.gameWeekPoints + posPoints[pos].gameWeekPoints,
    seasonPoints: prev.seasonPoints + posPoints[pos].seasonPoints,
  }), {
    gameWeekPoints: 0, seasonPoints: 0,
  }))
);

const getPoints = (team = []) => {
  const posPoints = team
    .reduce((prev, { gameWeekStats, seasonToGameWeek, teamPos }) => {
      const key = (getPositionLabel(teamPos) || {}).key;
      const gameWeek = prev[key] ? prev[key].gameWeekPoints + gameWeekStats.points : gameWeekStats.points;
      const season = prev[key] ? prev[key].seasonPoints + seasonToGameWeek.points : seasonToGameWeek.points;
      return {
        ...prev,
        [key]: {
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
