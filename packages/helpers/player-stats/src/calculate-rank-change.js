module.exports = (rankWeek1, rankWeek2 = {}) => {
    const changeTotal = {};
    const posChange = (
        Object.keys(rankWeek2)
            .reduce((prevWeek, managerName) => ({
                ...prevWeek,
                [managerName]: {
                    ...Object.keys(rankWeek2[managerName])
                        .filter((key) => key.toLowerCase() !== 'total')
                        .reduce((prev, pos) => {
                            const week2Scores = rankWeek2[managerName][pos];
                            const week1Scores = (rankWeek1 || { [managerName]: { [pos]: 0 } })[managerName][pos];
                            const change = week2Scores - week1Scores;
                            changeTotal[managerName] = changeTotal[managerName] || 0;
                            changeTotal[managerName] += change;
                            return ({
                                ...prev,
                                [pos]: change,
                            });
                        }, {}),
                    total: changeTotal[managerName],
                },
            }), {})
    );
    return posChange;
};
