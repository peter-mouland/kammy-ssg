export default (rankWeek1, rankWeek2 = {}) => {
  const changeTotal = {};
  const posChange = (
    Object.keys(rankWeek2)
      .filter((key) => key.toLowerCase() !== 'total')
      .reduce((prevWeek, pos) => ({
        ...prevWeek,
        [pos]: Object.keys(rankWeek2[pos]).reduce((prev, manager) => {
          const week2Scores = rankWeek2[pos][manager];
          const week1Scores = (rankWeek1 || { [pos]: { [manager]: 0 } })[pos][manager];
          const change = week2Scores - week1Scores;
          changeTotal[manager] = changeTotal[manager] || 0;
          changeTotal[manager] += change;
          return ({
            ...prev,
            [manager]: change,
          });
        }, {}),
      }), {})
  );
  return {
    ...posChange,
    total: changeTotal,
  };
};
