const validatePlayer = (teams) => {
    const players = Object.keys(teams).reduce((acc, manager) => [...acc, ...teams[manager]], []);
    const cache = {};
    const dupes = players.reduce((acc, player = {}) => {
        const dupe = [...acc];
        if (cache[player.playerCode] && !dupe.includes(player.playerCode)) {
            dupe.push(player.playerCode);
        }
        cache[player.playerCode] = true;
        return dupe;
    }, []);
    return dupes;
};

export default validatePlayer;
