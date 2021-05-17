const sortBy = require('@kammy/sort-columns');

const { positions } = require('./positions');

// comparison function: numeric order
const compare = (itemA, itemB) => itemA - itemB;

// reduction function to produce a map of array items to their index
const indexMap = (acc, item, index) => ({ ...acc, [item]: index });

// sum from x to x2
const sumRange = (min, max) => ((max - min + 1) * (min + max)) / 2;

function getRanks(values = []) {
    const rankIndex = values.slice().sort(compare).reduce(indexMap, {});
    const standardRanks = values.map((item, i, arr) => ({ rank: rankIndex[item], i: arr.length - i - 1 }));
    const rankCounts = standardRanks.reduce(
        (acc, { rank }) => ({
            ...acc,
            [rank]: {
                rank,
                count: ((acc[rank] && acc[rank].count) || 0) + 1,
            },
        }),
        {},
    );
    return standardRanks.map(({ rank }) => {
        const sum = sumRange(rankCounts[rank].rank - rankCounts[rank].count + 1, rankCounts[rank].rank);
        return sum / rankCounts[rank].count;
    });
}

/* teamsWithDivisionPoints
[
  {
    gameWeek: 36,
    managerName: 'James',
    divisionKey: 'premierLeague',
    manager___NODE: 'f367b744-bdf5-5a3b-a600-3970eef95623',
    points: {
      gks: [Object],
      cb: [Object],
      fb: [Object],
      mid: [Object],
      am: [Object],
      str: [Object],
      total: [Object]
    }
  },
  {
    gameWeek: 36,
    managerName: 'Johnny',
    divisionKey: 'premierLeague',
    manager___NODE: 'c0f25b28-93f7-5b2b-8b69-8ddc7768d9a9',
    points: {
      gks: [Object],
      cb: [Object],
      fb: [Object],
      mid: [Object],
      am: [Object],
      str: [Object],
      total: {
          gks: { gameWeekPoints: 0, seasonPoints: 0 },
          cb: { gameWeekPoints: 0, seasonPoints: 0 },
          fb: { gameWeekPoints: 0, seasonPoints: 0 },
          mid: { gameWeekPoints: 0, seasonPoints: 0 },
          am: { gameWeekPoints: 0, seasonPoints: 0 },
          str: { gameWeekPoints: 0, seasonPoints: 0 },
          total: { gameWeekPoints: 0, seasonPoints: 0 }
        }

    }
  },
  ...
]

 */
const getRank = (teamsWithDivisionPoints = []) => {
    const ranks = positions.reduce((prev, pos) => {
        const arr = teamsWithDivisionPoints.map((team) => ({ ...team.points, managerName: team.managerName }));
        const positionPoints = arr.map((item) => item[pos.key].seasonPoints);
        const ranked = getRanks(positionPoints);
        const rankings = {
            ...prev,
        };

        ranked.forEach((item, i) => {
            const { managerName } = arr[i];
            rankings[managerName] = {
                ...rankings[managerName],
                [pos.key]: item,
            };
        });
        return rankings;
    }, {});
    const division = [];
    Object.keys(ranks).forEach((managerName) => {
        const team = teamsWithDivisionPoints.find((thisTeam) => thisTeam.managerName === managerName);
        Object.keys(ranks[managerName]).forEach((position) => {
            ranks[managerName].total = (ranks[managerName].total || 0) + ranks[managerName][position];
            ranks[managerName].seasonPoints = team.points.total.seasonPoints;
            ranks[managerName].managerName = managerName;
        });
        division.push(ranks[managerName]);
    });
    const ranksWithOrder = division
        .sort(sortBy([`total`, 'seasonPoints']))
        .map((div, i) => ({
            ...div,
            order: i,
        }))
        .reduce(
            (prev, thisTeam) => ({
                ...prev,
                [thisTeam.managerName]: thisTeam,
            }),
            {},
        );
    return ranksWithOrder;
};

module.exports = getRank;
