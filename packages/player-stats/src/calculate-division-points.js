const { positions, getPositionLabel } = require('./positions');

const INITIAL_POINTS = positions.reduce((prev, pos) => (
  {
    ...prev,
    [pos.label]: { gameWeek: 0, season: 0 },
  }
), {});

const getTotal = (posPoints = {}) => (
  (Object.keys(posPoints).reduce((prev, pos) => ({
    gameWeek: prev.gameWeek + posPoints[pos].gameWeek,
    season: prev.season + posPoints[pos].season,
  }), {
    gameWeek: 0, season: 0,
  }))
);

const getPoints = (team = [], gameWeekIdx) => {
  const posPoints = team
    .reduce((prev, teamSheetItem) => {
      const { gameWeeks, seasonToGameWeek } = teamSheetItem;
      const player = gameWeeks[gameWeekIdx] || gameWeeks[gameWeeks.length - 1];
      const seasonToDate = seasonToGameWeek[gameWeekIdx] || seasonToGameWeek[seasonToGameWeek.length - 1];
      const key = (getPositionLabel(teamSheetItem.teamPos) || {}).label;
      const gameWeekPoints = player.gameWeekStats.points;
      const gameWeek = prev[key] ? prev[key].gameWeek + gameWeekPoints : gameWeekPoints;
      const season = prev[key] ? prev[key].season + seasonToDate.points : seasonToDate.points;
      return {
        ...prev,
        [key]: {
          gameWeek, season,
        },
      };
    }, {});
  return {
    ...posPoints,
    total: getTotal(posPoints),
  };
};

const getDivisionPoints = (managers, managersSeason = {}, gameWeek) => (
  (managers || []).map((manager) => ({
    manager,
    points: {
      ...INITIAL_POINTS,
      ...getPoints(managersSeason[manager], gameWeek),
    },
  }))
);

module.exports = getDivisionPoints;
