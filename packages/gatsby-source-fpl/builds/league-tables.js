const { nodeTypes, mediaTypes } = require('../lib/constants');
const getPoints = require('./lib/calculate-division-points');
const getRank = require('./lib/calculate-division-rank');
const getRankChange = require('./lib/calculate-rank-change');
const logger = require('../lib/log');

module.exports = ({ divisions, managers, teams, gameWeeks, createNodeId }) => {
    const logEnd = logger.timed('Build: League Tables');
    /**
     *  {
     *  teamPos: 'FB',
     *  posIndex: 3,
     *  pos: 'FB',
     *  hasChanged: false,
     *  division: undefined,
     *  gameWeek: 8,
     *  playerCode: 214590,
     *  gameWeekStats: {
     *    apps: 0,
     *    gls: 0,
     *    asts: 0,
     *    cs: 0,
     *    con: 0,
     *    pensv: 0,
     *    ycard: 0,
     *    rcard: 0,
     *    sb: 0,
     *    bp: 0,
     *    points: 0
     *  },
     *  seasonToGameWeek: {
     *    apps: 180,
     *    gls: 0,
     *    asts: 0,
     *    cs: 0,
     *    con: 5,
     *    pensv: 0,
     *    ycard: 1,
     *    rcard: 0,
     *    sb: 0,
     *    bp: 0,
     *    points: 0
     *  },
     *  managerName: 'Howie',
     *  manager___NODE: '1738ff31-8b42-51d1-b609-73738d55f39b',
     *  player___NODE: '214033d3-f9c5-52ea-8090-f18fd60d7117'
     *  },
     */
    const teamData = teams.map(({ data }) => data);
    const managerData = managers.map(({ data }) => data);
    const divisionData = divisions.map(({ data }) => data);
    const gameWeeksData = gameWeeks.map(({ data }) => data);

    /*
  {
    gameWeek: 1,
    divisionId: 'leagueOne',
    managerId: 'Tim',
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
    gameWeeksData.forEach((gameWeek) => {
        managerData.forEach(({ managerId, divisionId }) => {
            const team = teamData.filter(
                (item) => item.managerId === managerId && item.gameWeekIndex === gameWeek.gameWeekIndex,
            );
            const points = getPoints(team);
            results.push({
                gameWeekIndex: gameWeek.gameWeekIndex,
                managerId,
                divisionId,
                manager___NODE: createNodeId(`managers-${managerId}`),
                points,
            });
        });
    });

    /*
  {
    divisionId: 'leagueOne',
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
    gameWeeksData.forEach((gameWeek) => {
        divisionData.forEach(({ divisionId }) => {
            const divisionFilter = (manager) => manager.divisionId === divisionId;
            const divisionManagers = managerData.filter(divisionFilter).map(({ managerId }) => managerId);
            const managerFilter = (team) =>
                divisionManagers.includes(team.managerId) && team.gameWeekIndex === gameWeek.gameWeekIndex;
            const division = results.filter(managerFilter);
            const rank = getRank(division);
            if (Object.keys(rank).length === 0) {
                console.log({ managerData });
                console.log({ divisionManagers });
                console.log({ divisionId });
                console.log({ gameWeek });
                console.log({ rank });
                process.exit(1);
            }
            ranks.push({ divisionId, gameWeekIndex: gameWeek.gameWeekIndex, rank });
        });
    });

    /*
  {
    gameWeek: 1,
    managerId: 'Tim',
    divisionId: 'premierLeague',
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
        const findDivisionGameWeek = (rank) =>
            rank.gameWeekIndex === item.gameWeekIndex && rank.divisionId === item.divisionId;
        const findLastWeek = (rank) =>
            rank.gameWeekIndex === item.gameWeekIndex - 1 && rank.divisionId === item.divisionId;
        const divRankings = ranks.find(findDivisionGameWeek) || {};
        const divLastWeekRankings = ranks.find(findLastWeek) || {};
        const rankChange = getRankChange(divLastWeekRankings.rank, divRankings.rank);
        const points = Object.keys(item.points).reduce((prev, positionId) => {
            if (!divRankings.rank[item.managerId]) {
                console.log('manager rank not found');
                console.log('====={divRankings}====');
                console.log(divRankings);
                console.log('-{item}-');
                console.log(item);
                process.exit(1);
            }
            // eslint-disable-next-line no-param-reassign
            prev[positionId] = {
                ...prev[positionId],
                order: divRankings.rank[item.managerId].order,
                rank: divRankings.rank[item.managerId][positionId],
                rankChange: rankChange[item.managerId][positionId],
            };
            return prev;
        }, item.points);

        return {
            ...item,
            points,
        };
    });

    logEnd();

    return resultsWithRank.map((data, i) => ({
        resourceId: `league-tables-i${i}-${data.squadPositionId}-${data.managerId}-${data.gameWeekIndex}`,
        data,
        internal: {
            description: 'League Tables',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.leagueTable,
        },
    }));
};
