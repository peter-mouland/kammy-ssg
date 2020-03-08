/* eslint-disable no-console */
const hashContent = require('./lib/hash-content');
const fetchAllData = require('./sources/fetch-all');
const buildSkyScores = require('./builds/sky-sports-scores');
const buildSkyFixtures = require('./builds/sky-sports-fixtures');
const buildSkyPlayers = require('./builds/sky-sports-players');
const buildSkyPlayerStats = require('./builds/sky-sports-player-stats');
const buildGameWeeks = require('./builds/game-weeks');
const buildCup = require('./builds/cup');
const buildTransfers = require('./builds/transfers');
const buildPlayers = require('./builds/players');
const buildDivisions = require('./builds/divisions');
const buildManagers = require('./builds/managers');

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
      skyPlayerStatsData,
      googleGameWeekData,
      googleCupData,
      googleTransferData,
      googlePlayerData,
      googleDivisionData,
      googleManagerData,
    } = await fetchAllData();

    // build all the objects which will be used to create gatsby nodes
    const skyFixtures = buildSkyFixtures({ fixtureData });
    const skyPlayers = buildSkyPlayers({ playerData });
    const skyPlayerStats = buildSkyPlayerStats({ skyPlayerStatsData, createNodeId });
    const skyScores = buildSkyScores({ scoreData });
    const gameWeeks = buildGameWeeks({ googleGameWeekData });
    const cup = buildCup({ googleCupData });
    const transfers = buildTransfers({ googleTransferData, createNodeId });
    const players = buildPlayers({ googlePlayerData });
    const divisions = buildDivisions({ googleDivisionData });
    const managers = buildManagers({ googleManagerData, createNodeId });

    // create all the gatsby nodes
    const nodePromises = [
        ...(skyFixtures || []),
        ...(skyPlayers || []),
        ...(skyPlayerStats || []),
        ...(skyScores || []),
        ...(gameWeeks || []),
        ...(cup || []),
        ...(transfers || []),
        ...(players || []),
        ...(divisions || []),
        ...(managers || []),
    ].map((node) => createNode({ actions, createNodeId, node }));

    return Promise.all(nodePromises);
};
