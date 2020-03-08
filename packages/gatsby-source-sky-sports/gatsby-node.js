/* eslint-disable no-console */
const hashContent = require('./lib/hash-content');
const fetchAllData = require('./sources/fetch-all');
const buildScores = require('./builds/sky-sports-scores');
const buildFixtures = require('./builds/sky-sports-fixtures');
const buildPlayers = require('./builds/sky-sports-players');
const buildGameWeeks = require('./builds/game-weeks');
const buildCup = require('./builds/cup');

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
    const {
      fixtureData,
      playerData,
      scoreData,
      googleGameWeekData,
      googleCupData,
      // googleDivisionData,
      // googlePlayerData,
    } = await fetchAllData();

    // build all the objects which will be used to create gatsby nodes
    const fixtures = buildFixtures({ fixtureData });
    const players = buildPlayers({ playerData });
    const scores = buildScores({ scoreData });
    const gameWeeks = buildGameWeeks({ googleGameWeekData });
    const cup = buildCup({ googleCupData });

    // create all the gatsby nodes
    const nodePromises = [
        ...(fixtures || []),
        ...(players || []),
        ...(scores || []),
        ...(gameWeeks || []),
        ...(cup || []),
    ].map((node) => createNode({ actions, createNodeId, node }));

    return Promise.all(nodePromises);
};
