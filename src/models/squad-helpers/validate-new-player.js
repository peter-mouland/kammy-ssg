const validateNewPlayer = (Squads) => {
    const unknownPlayers = Squads.allPlayers.filter(({ player }) => !player);
    if (unknownPlayers.length) {
        // eslint-disable-next-line no-console
        console.log(unknownPlayers);
    }
    return Squads.allPlayers.reduce((acc, { player = {} } = {}) => (player?.new ? [...acc, player.code] : acc), []);
};

export default validateNewPlayer;
