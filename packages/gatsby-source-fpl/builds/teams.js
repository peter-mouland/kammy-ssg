const { TeamSeason } = require('./lib/team-season');
const { TeamByGameWeek } = require('./lib/TeamByGameWeek');
const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ draft, transfers, gameWeeks, players, managers, createNodeId }) => {
    const logEnd = logger.timed('Build: Teams');

    // extract the data from the node
    const gameWeekData = gameWeeks.map(({ data }) => data);
    const transferData = transfers.map(({ data }) => data);
    const playerData = players.map(({ data }) => data);
    const managerData = managers.map(({ data }) => data);
    const draftData = draft.map(({ data }) => data);

    // filter and set required vars
    const validTransfers = transferData.filter((transfer) => transfer.isValid);
    const getValidManagerTransfers = (manager) => validTransfers.filter((transfer) => transfer.managerName === manager);

    const draftByManager = draftData.reduce(
        (prev, { manager }) => ({
            ...prev,
            [manager]: draftData.filter((pick) => pick.manager === manager),
        }),
        {},
    );

    const playersByName = playerData.reduce(
        (prev, player) => ({
            ...prev,
            [player.name]: { ...player },
        }),
        {},
    );

    const allTeamPlayers = managerData.reduce((prev, { manager, division }) => {
        if (!draftByManager[manager]) {
            logger.error(`Manager Mismatch: ${manager}`);
        }

        const teamByGameWeek = new TeamByGameWeek({
            draft: draftByManager[manager],
            transfers: getValidManagerTransfers(manager),
            gameWeeks: gameWeekData,
            players: playersByName,
        });

        const seasonGameWeeks = teamByGameWeek.getSeason();
        const teamSeason = new TeamSeason({
            manager,
            division,
            gameWeeks: seasonGameWeeks,
            players: playersByName,
        });
        const season = teamSeason.getSeason();
        return [...prev, ...season];
    }, []);

    const teams = allTeamPlayers.map((item, i) => {
        const data = {
            ...item,
            managerName: item.manager,
        };
        delete data.manager;

        return {
            resourceId: `teams-${i}-${data.managerName}-${data.playerName}`,
            data: {
                ...data,
                manager___NODE: createNodeId(`managers-${data.managerName}`),
                player___NODE: createNodeId(`players-${data.playerName}`),
            },
            internal: {
                description: 'Teams',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.teams,
            },
        };
    });
    logEnd();
    return teams;
};
