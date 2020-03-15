const { positions } = require('./positions');

// comparison function: numeric order
const compare = (itemA, itemB) => (itemA - itemB);

// reduction function to produce a map of array items to their index
const indexMap = (acc, item, index) => ({ ...acc, [item]: index });

// sum from x to x2
const sumRange = (min, max) => ((max - min + 1) * (min + max)) / 2;

function getRanks(values = []) {
  const rankIndex = values.slice().sort(compare).reduce(indexMap, {});
  const standardRanks = values.map((item, i, arr) => ({ rank: rankIndex[item], i: arr.length - i - 1 }));
  const rankCounts = standardRanks.reduce((acc, { rank }) => ({
    ...acc,
    [rank]: {
      rank,
      count: ((acc[rank] && acc[rank].count) || 0) + 1,
    },
  }), {});
  return standardRanks.map(({ rank }) => {
    const sum = sumRange(rankCounts[rank].rank - rankCounts[rank].count + 1, rankCounts[rank].rank);
    return (sum / rankCounts[rank].count);
  });
}

const getRank = (teamsWithDivisionPoints = []) => {
  const ranks = (
    positions
      .reduce((prev, pos) => {
        const arr = teamsWithDivisionPoints.map((team) => ({ ...team.points, managerName: team.managerName }));
        const positionPoints = arr.map((item) => item[pos.key].seasonPoints);
        const ranked = getRanks(positionPoints);
        const rankings = {
          ...prev,
        };

        ranked
            .forEach((item, i) => {
              const managerName = arr[i].managerName;
              rankings[managerName] = {
                ...rankings[managerName],
                [pos.key]: item,
              }
            });
        return rankings;
      }, {})
  );
  Object.keys(ranks).forEach((managerName) => {
    Object.keys(ranks[managerName]).forEach((position) => {
      ranks[managerName].total = (ranks[managerName].total || 0) + ranks[managerName][position];
    });
  });
  return ranks;
};

module.exports = getRank;
