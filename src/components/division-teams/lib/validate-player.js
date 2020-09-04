const validatePlayer = (teams) => {
    const players = Object.keys(teams).reduce((acc, manager) => [...acc, ...teams[manager]], []);
    const cache = {};
    const dupes = players.reduce((acc, player = {}) => {
        const dupe = [...acc];
        if (cache[player.playerName] && !dupe.includes(player.playerName)) {
            dupe.push(player.playerName);
        }
        cache[player.playerName] = true;
        return dupe;
    }, []);
    return dupes;
};

export default validatePlayer;
