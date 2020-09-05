const validateNewPlayer = (teams) => {
    const players = Object.keys(teams).reduce((acc, manager) => [...acc, ...teams[manager]], []);
    return players.reduce((acc, { player = {} } = {}) => {
        return player.new ? [...acc, player.name] : acc;
    }, []);
};

export default validateNewPlayer;
