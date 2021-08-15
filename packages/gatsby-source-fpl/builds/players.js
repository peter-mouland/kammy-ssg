const mergePlayers = require('./lib/merge-players');
const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ googlePlayerData, gameWeeks, fplPlayers }) => {
    const logEnd = logger.timed('Build: Players');

    const mergedPlayers = mergePlayers({ googlePlayerData, gameWeeks, fplPlayers });

    logEnd();
    return Object.values(mergedPlayers).map((player) => {
        if (typeof player.season.bp === 'undefined') {
            console.log(player);
            console.error('No BP, what?');
        }
        console.log(`create resourceId: players-${player.code}`);
        return {
            resourceId: `players-${player.code}`,
            data: player,
            internal: {
                description: 'Players',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.players,
            },
        };
    });
};
