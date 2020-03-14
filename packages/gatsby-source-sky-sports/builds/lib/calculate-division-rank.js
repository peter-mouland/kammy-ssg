import positions from './positions';

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

const getTeamRank = (arr = [], pos, dataKey) => {
  const positionPoints = arr.map((item) => item[pos][dataKey]);
  const ranked = getRanks(positionPoints);

  return ranked
    .map((item, i) => ({ rank: item, manager: arr[i].manager }))
    .reduce((prev, item) => ({
      ...prev,
      [item.manager]: item.rank,
    }), {});
};

const getRank = (teamsWithDivisionPoints = []) => {
  const ranks = (
    positions
      .reduce((prev, pos) => {
        const posRanks = getTeamRank(
          teamsWithDivisionPoints.map(
            (team) => ({ ...team.points, manager: team.manager }),
          ),
          pos.label,
          'season',
        );
        return ({
          ...prev,
          [pos.label]: posRanks,
        });
      }, {})
  );
  const total = {};
  Object.keys(ranks).forEach((position) => {
    Object.keys(ranks[position]).forEach((manager) => {
      total[manager] = (total[manager] || 0) + ranks[position][manager];
    });
  });
  return {
    ...ranks,
    total,
  };
};

export default getRank;
