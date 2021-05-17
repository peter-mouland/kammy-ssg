const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleCupData, createNodeId }) =>
    googleCupData.map((cup) => {
        const gatsbyData = {
            status: cup.status,
            timestamp: cup.timestamp, // toGmt() ?
            row: cup.__row,
            group: (cup.group || '').trim(),
            gameWeek: cup.gameweek,
            round: (cup.round || '').trim(),
            manager: (cup.manager || '').trim(),
            player1Name: (cup.player1 || '').trim(),
            player2Name: (cup.player2 || '').trim(),
            player3Name: (cup.player3 || '').trim(),
            player4Name: (cup.player4 || '').trim(),
        };

        if (gatsbyData.player1Name) {
            gatsbyData.player1___NODE = createNodeId(`skysports-players-${gatsbyData.player1Name}`);
        }
        if (gatsbyData.player2Name) {
            gatsbyData.player2___NODE = createNodeId(`skysports-players-${gatsbyData.player2Name}`);
        }
        if (gatsbyData.player3Name) {
            gatsbyData.player3___NODE = createNodeId(`skysports-players-${gatsbyData.player3Name}`);
        }
        if (gatsbyData.player4Name) {
            gatsbyData.player4___NODE = createNodeId(`skysports-players-${gatsbyData.player4Name}`);
        }

        return {
            resourceId: `cup-${gatsbyData.gameWeek}-${gatsbyData.row}`,
            data: gatsbyData,
            internal: {
                description: 'Cup',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.cup,
            },
        };
    });
