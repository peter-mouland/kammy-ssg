const mergePlayers = require('./lib/merge-players');
const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ googlePlayerData, gameWeeks, skyPlayers }) => {
    const logEnd = logger.timed('Build: Players 1920');

    const mergedPlayers = mergePlayers({ googlePlayerData, gameWeeks, skyPlayers });

    logEnd();
    return Object.values(mergedPlayers).map((player) => ({
        resourceId: `players1920-${player.name}`,
        data: player,
        internal: {
            description: 'Players stats from the 19/20 season using latest rules',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.players1920,
        },
    }));
};
