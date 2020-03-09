
const sortingFactory = (pos, data) => (itemA, itemB) => itemA[data][pos] - itemB[data][pos];

function rank(arr, pos, data) {
  const sorter = sortingFactory(pos, data);
  const sorted = arr.slice().sort(sorter);
  const ranked = arr.map((item) => sorted.findIndex((i) => sorter(item, i) === 0));
  const adjustRankForTies = (item, i) => (
    ranked.findIndex((rItem, rI) => rItem === item && i !== rI) > -1 ? item + 0.5 : item
  );
  return ranked.map(adjustRankForTies);
}

modul.exports = (teams) => {
  const gwGKS = rank(teams, 'gks', 'gameWeek');
  const gwCB = rank(teams, 'cb', 'gameWeek');
  const gwFB = rank(teams, 'fb', 'gameWeek');
  const gwAM = rank(teams, 'am', 'gameWeek');
  const gwMID = rank(teams, 'mid', 'gameWeek');
  const gwSTR = rank(teams, 'str', 'gameWeek');
  const sGKS = rank(teams, 'gks', 'season');
  const sCB = rank(teams, 'cb', 'season');
  const sFB = rank(teams, 'fb', 'season');
  const sAM = rank(teams, 'am', 'season');
  const sMID = rank(teams, 'mid', 'season');
  const sSTR = rank(teams, 'str', 'season');

  const gwPointsTotal = teams.reduce((sum, team) => sum + team.gameWeek.points, 0);

  return teams.map((team, i) => {
    const seasonRank = {
      gks: sGKS[i],
      fb: sFB[i],
      cb: sCB[i],
      mid: sMID[i],
      am: sAM[i],
      str: sSTR[i],
      points: sGKS[i] + sCB[i] + sFB[i] + sAM[i] + sMID[i] + sSTR[i],
    };

    const gameWeekRankChange = {
      gks: !gwPointsTotal ? 0 : (gwGKS[i] - sGKS[i]),
      cb: !gwPointsTotal ? 0 : (gwCB[i] - sCB[i]),
      fb: !gwPointsTotal ? 0 : (gwFB[i] - sFB[i]),
      mid: !gwPointsTotal ? 0 : (gwMID[i] - sMID[i]),
      am: !gwPointsTotal ? 0 : (gwAM[i] - sAM[i]),
      str: !gwPointsTotal ? 0 : (gwSTR[i] - sSTR[i]),
    };

    return {
      ...team,
      gameWeekRankChange: {
        ...gameWeekRankChange,
        points:
        gameWeekRankChange.cb
          + gameWeekRankChange.fb
          + gameWeekRankChange.am
          + gameWeekRankChange.mid
          + gameWeekRankChange.str
          + gameWeekRankChange.gks,
      },
      seasonRank,
    };
  });
};
