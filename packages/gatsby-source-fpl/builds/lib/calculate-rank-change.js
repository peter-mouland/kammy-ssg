module.exports = (rankWeek1, rankWeek2 = {}) => {
    const changeTotal = {};
    const posChange = Object.keys(rankWeek2)
        .filter((key) => key.toLowerCase() !== 'total')
        .reduce(
            (prevWeek, pos) => ({
                ...prevWeek,
                [pos]: Object.keys(rankWeek2[pos]).reduce((prev, managerId) => {
                    const week2Scores = rankWeek2[pos][managerId];
                    const week1Scores = (rankWeek1 || { [pos]: { [managerId]: 0 } })[pos][managerId];
                    const change = week2Scores - week1Scores;
                    changeTotal[managerId] = changeTotal[managerId] || 0;
                    changeTotal[managerId] += change;
                    return {
                        ...prev,
                        [managerId]: change,
                    };
                }, {}),
            }),
            {},
        );
    return {
        ...posChange,
        total: changeTotal,
    };
};
