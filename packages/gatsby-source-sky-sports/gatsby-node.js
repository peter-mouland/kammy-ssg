/* eslint-disable no-console */
const hashContent = require('./lib/hash-content');
const fetchAllData = require('./sources/fetch-all');
const buildScores = require('./builds/sky-sports-scores');
const buildFixtures = require('./builds/sky-sports-fixtures');
const buildPlayerFixtures = require('./builds/sky-sports-player-fixtures');
const buildPlayers = require('./builds/sky-sports-players');

const createNode = ({ actions, createNodeId, node }) =>
    actions.createNode({
        parent: null,
        children: [],
        ...node.data,
        id: createNodeId(node.resourceId),
        internal: {
            ...node.internal,
            contentDigest: hashContent({ data: node.data, resourceId: node.resourceId }),
        },
    });

exports.sourceNodes = async (
    { actions, createNodeId },
) => {
    const { fixtureData, playerData, playerFixtureData, scoreData  } = await fetchAllData();

    // build all the objects which will be used to create gatsby nodes
    const fixtures = buildFixtures({ fixtureData });
    const players = buildPlayers({ playerData });
    const scores = buildScores({ scoreData });
    const playersFixtures = buildPlayerFixtures({ playerFixtureData  });

    // create all the gatsby nodes
    const nodePromises = [
        ...(fixtures || []),
        ...(players || []),
        ...(scores || []),
        ...(playersFixtures || []),
    ].map((node) => createNode({ actions, createNodeId, node }));

    return Promise.all(nodePromises);
};
