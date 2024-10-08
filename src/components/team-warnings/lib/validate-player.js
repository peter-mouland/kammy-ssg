const validatePlayer = (allPlayers) => {
    const cache = {};
    const dupes = allPlayers.reduce((prev, player = {}) => {
        if (cache[player.code] && !prev.includes(player.code)) {
            prev.push(player.code);
        }
        cache[player.code] = true;
        return prev;
    }, []);
    return dupes;
};

export default validatePlayer;
