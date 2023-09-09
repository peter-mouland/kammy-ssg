/* eslint-disable no-console */
const mergePlayers = require('./lib/merge-players');
const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ googlePlayerData, gameWeeks, fplPlayers, fplTeams }) => {
    const logEnd = logger.timed('Build: Players');

    const mergedPlayers = mergePlayers({ googlePlayerData, gameWeeks, fplPlayers, fplTeams });

    logEnd();
    return Object.values(mergedPlayers).map((player) => ({
        resourceId: `players-${player.code}`,
        data: player,
        internal: {
            description: 'Players',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.players,
        },
    }));
};
