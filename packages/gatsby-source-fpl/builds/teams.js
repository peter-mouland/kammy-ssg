const { TeamSeason } = require('./lib/team-season');
const { TeamByGameWeek } = require('./lib/TeamByGameWeek');
const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ draft, transfers, gameWeeks, players, managers, fplTeams, createNodeId }) => {
    const logEnd = logger.timed('Build: Teams');

    // extract the data from the node
    const gameWeekData = gameWeeks.map(({ data }) => data);
    const transferData = transfers.map(({ data }) => data);
    const playerData = players.map(({ data }) => data);
    const managerData = managers.map(({ data }) => data);
    const draftData = draft.map(({ data }) => data);

    // filter and set required vars
    const validTransfers = transferData.filter((transfer) => transfer.isValid);
    const getValidManagerTransfers = (managerId) =>
        validTransfers.filter((transfer) => transfer.managerId === managerId);

    const draftByManager = draftData.reduce(
        (prev, { managerId }) => ({
            ...prev,
            [managerId]: draftData.filter((pick) => pick.managerId === managerId),
        }),
        {},
    );

    const playersByCode = playerData.reduce(
        (prev, player) => ({
            ...prev,
            [player.code]: player,
        }),
        {},
    );

    const allTeamPlayers = managerData.reduce((prev, { managerId, divisionId }) => {
        if (!draftByManager[managerId]) {
            logger.error(`Manager Mismatch: ${managerId}`);
        }
        const debug = false; // managerId === 'tom-f';
        const validManagerTransfers = getValidManagerTransfers(managerId);
        const teamByGameWeek = new TeamByGameWeek({
            draft: draftByManager[managerId],
            transfers: validManagerTransfers,
            gameWeeks: gameWeekData,
            playersByCode,
            debug,
        });

        const seasonGameWeeks = teamByGameWeek.getSeason();
        const teamSeason = new TeamSeason({
            managerId,
            divisionId,
            gameWeeks: seasonGameWeeks,
            playersByCode,
            fplTeams,
        });
        const season = teamSeason.getSeason();
        return [...prev, ...season];
    }, []);
    const teams = allTeamPlayers.map((data, i) => ({
        resourceId: `teams-${i}-${data.managerId}-${data.playerCode}`,
        data: {
            ...data,
            manager___NODE: createNodeId(`managers-${data.managerId}`),
            player___NODE: createNodeId(`players-${data.playerCode}`),
        },
        internal: {
            description: 'Teams',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.teams,
        },
    }));
    logEnd();
    return teams;
};
