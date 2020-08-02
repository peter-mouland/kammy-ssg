const { nodeTypes, mediaTypes } = require('../lib/constants');
const getPoints = require('./lib/calculate-division-points');
const getRank = require('./lib/calculate-division-rank');
const getRankChange = require('./lib/calculate-rank-change');

module.exports = ({
    divisions, managers, teams, createNodeId,
}) => {
    console.log('Build: League Tables start');
    const start = new Date();
    const teamData = teams.map(({ data }) => data);
    const managerData = managers.map(({ data }) => data);
    const divisionData = divisions.map(({ data }) => data);
    const gameWeeks = [...new Set(teamData.map((player) => player.gameWeek))];

    /*
  {
    gameWeek: 1,
    divisionKey: 'leagueOne',
    managerName: 'Tim',
    manager___NODE: '2d7ebc98-3415-58a9-9091-627ff93f3188',
    points: {
      gks: { gameWeekPoints: 9, seasonPoints: 9 },
      cb: { gameWeekPoints: 13, seasonPoints: 13 },
      fb: { gameWeekPoints: 7, seasonPoints: 7 },
      mid: { gameWeekPoints: 10, seasonPoints: 10 },
      am: { gameWeekPoints: 12, seasonPoints: 12 },
      str: { gameWeekPoints: 9, seasonPoints: 9 },
      total: { gameWeekPoints: 60, seasonPoints: 60 }
    }
  }
   */
    const results = [];
    gameWeeks.forEach((gameWeek) => {
        managerData.forEach(({ manager, divisionKey }) => {
            const team = teamData.filter((item) => item.managerName === manager && item.gameWeek === gameWeek);
            const points = getPoints(team);
            results.push({
                gameWeek,
                managerName: manager,
                divisionKey,
                manager___NODE: createNodeId(`managers-${manager}`),
                points,
            });
        });
    });

    /*
  {
    division: 'leagueOne',
    gameWeek: 10,
    rank: {
      Chris: { gks: 7, cb: 7, fb: 5, mid: 5, am: 3, str: 3 },
      Ed: { gks: 2, cb: 0, fb: 4, mid: 0.5, am: 7, str: 0 },
      Howie: { gks: 6, cb: 4, fb: 7, mid: 0.5, am: 5, str: 2 },
      Jezz: { gks: 3, cb: 6, fb: 1, mid: 5, am: 0, str: 7 },
      'Jim Bob': { gks: 0, cb: 5, fb: 0, mid: 7, am: 4, str: 4 },
      Matt: { gks: 1, cb: 3, fb: 6, mid: 3, am: 1.5, str: 6 },
      Paul: { gks: 4, cb: 2, fb: 2, mid: 2, am: 6, str: 1 },
      'Tom F': { gks: 5, cb: 1, fb: 3, mid: 5, am: 1.5, str: 5 },
      total: { gks: 28, cb: 28, fb: 28, mid: 28, am: 28, str: 28 }
    }
  }
   */
    const ranks = [];
    gameWeeks.forEach((gameWeek) => {
        divisionData.forEach(({ key }) => {
            const divisionFilter = ({ divisionKey }) => divisionKey === key;
            const divisionManagers = managerData.filter(divisionFilter).map(({ manager }) => manager);
            const managerFilter = (team) => divisionManagers.includes(team.managerName) && team.gameWeek === gameWeek;
            const division = results.filter(managerFilter);
            const rank = getRank(division);
            ranks.push({ divisionKey: key, gameWeek, rank });
        });
    });

    /*
  {
    gameWeek: 1,
    managerName: 'Tim',
    divisionKey: 'premierLeague',
    manager___NODE: '2d7ebc98-3415-58a9-9091-627ff93f3188',
    points: {
      gks: { gameWeekPoints: 9, seasonPoints: 9, rank: 4 },
      cb: { gameWeekPoints: 13, seasonPoints: 13, rank: 3 },
      fb: { gameWeekPoints: 7, seasonPoints: 7, rank: 1 },
      mid: { gameWeekPoints: 10, seasonPoints: 10, rank: 6 },
      am: { gameWeekPoints: 12, seasonPoints: 12, rank: 6 },
      str: { gameWeekPoints: 9, seasonPoints: 9, rank: 4 },
      total: { gameWeekPoints: 60, seasonPoints: 60, rank: undefined }
    }
  }
   */
    const resultsWithRank = results.map((item) => {
        const findDivisionGameWeek = (rank) => rank.gameWeek === item.gameWeek && rank.divisionKey === item.divisionKey;
        const findLastWeek = (rank) => rank.gameWeek === (item.gameWeek - 1) && rank.divisionKey === item.divisionKey;
        const divRankings = ranks.find(findDivisionGameWeek) || {};
        const divLastWeekRankings = ranks.find(findLastWeek) || {};
        const rankChange = getRankChange(divLastWeekRankings.rank, divRankings.rank);
        const points = Object.keys(item.points).reduce((prev, posKey) => ({
            ...prev,
            [posKey]: {
                ...prev[posKey],
                rank: divRankings.rank[item.managerName][posKey],
                rankChange: rankChange[item.managerName][posKey],
            },
        }), item.points);

        return {
            ...item,
            points,
        };
    });

    const ms = new Date() - start;
    console.log('Build: League Tables end: ', ms);

    return resultsWithRank.map((data, i) => ({
        resourceId: `league-tables-i${i}-${data.teamPos}-${data.manager}-${data.gameWeek}`,
        data,
        internal: {
            description: 'League Tables',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.leagueTable,
        },
    }));
};
