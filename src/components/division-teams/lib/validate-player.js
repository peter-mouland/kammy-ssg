const validatePlayer = (managersSeason, intGameWeek) => {
    const players = Object.keys(managersSeason).reduce(
        (acc, manager) => [
            ...acc,
            ...managersSeason[manager].map((teamSheetItem) => teamSheetItem.gameWeeks[intGameWeek]),
        ],
        [],
    );
    const cache = {};
    return players
        .reduce((acc, player = {}) => {
            const dupe = [...acc];
            if (cache[player.name] && !dupe.includes(player.name)) {
                dupe.push(player.name);
            }
            cache[player.name] = true;
            return dupe;
        }, [])
        .filter(Boolean)
        .filter(({ club }) => !!club);
};

export default validatePlayer;
