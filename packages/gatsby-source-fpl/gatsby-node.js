// eslint-disable-next-line import/order
const fetch = require('./lib/fetch');

global.fetch = fetch;

const { createSchemaCustomization } = require('./create-schema-customization');
const hashContent = require('./lib/hash-content');
const fetchAllData = require('./sources/fetch-all');
const buildFplEvents = require('./builds/fpl-events');
const buildFplFixtures = require('./builds/fpl-fixtures');
const buildFplPlayers = require('./builds/fpl-players');
const buildFplPositions = require('./builds/fpl-positions');
const buildFplTeams = require('./builds/fpl-teams');
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

exports.createSchemaCustomization = createSchemaCustomization;
exports.sourceNodes = async ({ actions, createNodeId }) => {
    const {
        fplData,
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
    const fplPlayers = buildFplPlayers(fplData);
    const fplFixtures = buildFplFixtures(fplData);
    const fplTeams = buildFplTeams(fplData);
    const fplFPositions = buildFplPositions(fplData);
    const fplEvents = buildFplEvents(fplData);
    const gameWeeks = buildGameWeeks({ googleGameWeekData, fplEvents, fplFixtures, fplTeams });
    const divisions = buildDivisions({ googleDivisionData });
    const players = buildPlayers({ googlePlayerData, gameWeeks, fplPlayers, fplTeams });

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
        fplTeams,
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
        ...(fplFixtures || []),
        ...(fplPlayers || []),
        ...(fplTeams || []),
        ...(fplFPositions || []),
        ...(fplEvents || []),
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
