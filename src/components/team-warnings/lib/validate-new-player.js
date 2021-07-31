const validateNewPlayer = (teams) => {
    const players = Object.keys(teams).reduce((acc, manager) => [...acc, ...teams[manager]], []);
    const unknownPlayers = players.filter(({ player }) => !player);
    if (unknownPlayers.length) {
        console.log(unknownPlayers);
    }
    return players.reduce((acc, { player = {} } = {}) => {
        if (!player) {
            console.log('No _new_ player!');
        }
        return player?.new ? [...acc, player.name] : acc;
    }, []);
};

export default validateNewPlayer;
