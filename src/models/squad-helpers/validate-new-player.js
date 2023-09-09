const validateNewPlayer = (Squads) =>
    Squads.allPlayers.reduce((acc, { player = {} } = {}) => (player?.new ? [...acc, player.code] : acc), []);

export default validateNewPlayer;
