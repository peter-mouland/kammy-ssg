/* eslint-disable no-console */
// eslint-disable-next-line import/order
const fetch = require('./lib/fetch');

global.fetch = fetch;

const hashContent = require('./lib/hash-content');
const fetchAllData = require('./sources/fetch-all');
const buildSkyScores = require('./builds/sky-sports-scores');
const buildSkyFixtures = require('./builds/sky-sports-fixtures');
const buildSkyPlayers = require('./builds/sky-sports-players');
const buildGameWeeks = require('./builds/game-weeks');
const buildCup = require('./builds/cup');
const buildTransfers = require('./builds/transfers');
const buildPlayers = require('./builds/players');
const buildDivisions = require('./builds/divisions');
const buildManagers = require('./builds/managers');
const buildDraft = require('./builds/draft');
const buildTeams = require('./builds/teams');
const buildLeagueTables = require('./builds/league-tables');

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

exports.sourceNodes = async ({ actions, createNodeId }) => {
    const {
        skySportsFixtureData,
        skySportsPlayerData,
        skySportsScoreData,
        googleGameWeekData,
        googleCupData,
        googleTransferData,
        googlePlayerData,
        googleDivisionData,
        googleManagerData,
        googleDraftData,
    } = await fetchAllData();
    // build all the objects which will be used to create gatsby nodes

    // first, all those without deps i.e. ___node
    const skyFixtures = buildSkyFixtures({ skySportsFixtureData });
    const skyPlayers = buildSkyPlayers({ skySportsPlayerData });
    const skyScores = buildSkyScores({ skySportsScoreData });
    const gameWeeks = buildGameWeeks({ googleGameWeekData, skyFixtures });
    const divisions = buildDivisions({ googleDivisionData });
    const players = buildPlayers({ googlePlayerData, gameWeeks, skyPlayers });

    // second, all those with deps i.e. ___node
    const cup = buildCup({ googleCupData, createNodeId }); // relies on sky players
    const managers = buildManagers({ googleManagerData, createNodeId }); // relies on divisions
    const draft = buildDraft({ googleDraftData, createNodeId }); // relies on players + divisions
    const transfers = buildTransfers({ googleTransferData, createNodeId }); // relies on players + divisions + managers
    const teams = buildTeams({
        draft,
        managers,
        transfers,
        gameWeeks,
        players,
        createNodeId,
    }); // relies on players + managers

    // last - the tables
    const leagueTables = buildLeagueTables({
        divisions,
        managers,
        teams,
        createNodeId,
    });

    // create all the gatsby nodes
    const nodePromises = [
        // first
        ...(skyFixtures || []),
        ...(skyPlayers || []),
        ...(skyScores || []),
        ...(gameWeeks || []),
        ...(divisions || []),
        ...(players || []),
        // second
        ...(cup || []),
        ...(managers || []),
        ...(draft || []),
        ...(transfers || []),
        ...(teams || []),
        // last
        ...(leagueTables || []),
    ].map((node) => createNode({ actions, createNodeId, node }));

    return Promise.all(nodePromises);
};
