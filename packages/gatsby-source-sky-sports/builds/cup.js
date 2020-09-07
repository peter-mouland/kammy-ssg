const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleCupData, createNodeId }) =>
    googleCupData.map((cup) => {
        const gatsbyData = {
            status: cup.status,
            timestamp: cup.timestamp, // toGmt() ?
            row: cup.__row,
            group: cup.group.trim(),
            gameWeek: cup.gameweek,
            round: cup.round.trim(),
            manager: cup.manager.trim(),
            player1Name: cup.player1.trim(),
            player2Name: cup.player2.trim(),
            player3Name: cup.player3.trim(),
            player4Name: cup.player4.trim(),
        };
        return {
            resourceId: `cup-${gatsbyData.gameWeek}-${gatsbyData.row}`,
            data: {
                ...gatsbyData,
                player1___NODE: createNodeId(`skysports-players-${gatsbyData.player1Name}`),
                player2___NODE: createNodeId(`skysports-players-${gatsbyData.player2Name}`),
                player3___NODE: createNodeId(`skysports-players-${gatsbyData.player3Name}`),
                player4___NODE: createNodeId(`skysports-players-${gatsbyData.player4Name}`),
            },
            internal: {
                description: 'Cup',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.cup,
            },
        };
    });
