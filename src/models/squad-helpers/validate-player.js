const validatePlayer = (Squads) => {
    const cache = {};
    const dupes = Squads.allPlayers.reduce((prev, player = {}) => {
        if (cache[player.code]) {
            prev.push(player.code);
        }
        cache[player.code] = true;
        return prev;
    }, []);
    return dupes;
};

export default validatePlayer;
