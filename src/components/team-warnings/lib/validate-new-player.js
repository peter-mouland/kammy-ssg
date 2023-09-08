const validateNewPlayer = (allPlayers) => {
    const unknownPlayers = allPlayers.filter(({ player }) => !player);
    if (unknownPlayers.length) {
        // eslint-disable-next-line no-console
        console.log(unknownPlayers);
    }
    return allPlayers.reduce((acc, { player = {} } = {}) => {
        if (!player) {
            // eslint-disable-next-line no-console
            console.log('No _new_ player!');
        }
        return player?.new ? [...acc, player.code] : acc;
    }, []);
};

export default validateNewPlayer;
