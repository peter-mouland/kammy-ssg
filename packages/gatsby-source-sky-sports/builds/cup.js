const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleCupData, createNodeId }) => googleCupData.map((cup) => {
    const data = {
        status: cup.status,
        timestamp: cup.timestamp,
        // eslint-disable-next-line no-underscore-dangle
        row: cup.__row,
        group: cup.group.trim(),
        gameWeek: cup.gameweek,
        round: cup.round.trim(),
        manager: cup.manager.trim(),
        player1: cup.player1.trim(),
        player2: cup.player2.trim(),
        player3: cup.player3.trim(),
        player4: cup.player4.trim(),
    };
    return {
        resourceId: `cup-${data.gameWeek}-${data.row}`,
        data: {
            ...data,
            player1___NODE: createNodeId(`skysports-players-${data.player1}`),
            player2___NODE: createNodeId(`skysports-players-${data.player2}`),
            player3___NODE: createNodeId(`skysports-players-${data.player3}`),
            player4___NODE: createNodeId(`skysports-players-${data.player4}`),
        },
        internal: {
            description: 'Cup',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.cup,
        },
    };
});
