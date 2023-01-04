const validateNewPlayer = (teams) => {
    const players = Object.keys(teams).reduce((acc, manager) => [...acc, ...teams[manager]], []);
    const unknownPlayers = players.filter(({ player }) => !player);
    if (unknownPlayers.length) {
        // eslint-disable-next-line no-console
        console.log(unknownPlayers);
    }
    return players.reduce((acc, { player = {} } = {}) => {
        if (!player) {
            // eslint-disable-next-line no-console
            console.log('No _new_ player!');
        }
        return player?.new ? [...acc, player.code] : acc;
    }, []);
};

export default validateNewPlayer;
