const { TeamSeason } = require('@kammy/data.player-stats/src/team-season');

const { TeamByGameWeek } = require('./lib/TeamByGameWeek');
const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({
    draft, transfers, gameWeeks, players, managers, createNodeId,
}) => {
    console.log('Build: Teams start');
    const start = new Date();
    // extract the data from the node
    const gameWeekData = gameWeeks.map(({ data }) => data);
    const transferData = transfers.map(({ data }) => data);
    const playerData = players.map(({ data }) => data);
    const managerData = managers.map(({ data }) => data);
    const draftData = draft.map(({ data }) => data);

    // filter and set required vard
    const validTransfers = transferData.filter((transfer) => transfer.isValid);
    const getValidManagerTransfers = (manager) => validTransfers.filter((transfer) => transfer.manager === manager);

    const draftByManager = draftData.reduce((prev, { manager }) => ({
        ...prev,
        [manager]: draftData.filter((pick) => pick.manager === manager),
    }), {});

    const playersByName = playerData.reduce((prev, player) => ({
        ...prev,
        [player.name]: { ...player },
    }), {});

    const allTeamPlayers = managerData.reduce((prev, { manager, division }) => {
        const teamByGameWeek = new TeamByGameWeek({
            draft: draftByManager[manager],
            transfers: getValidManagerTransfers(manager),
            gameWeeks: gameWeekData,
            players: playersByName,
        });
        const seasonGameWeeks = teamByGameWeek.getSeason();
        const teamSeason = new TeamSeason({
            manager, division, gameWeeks: seasonGameWeeks, players: playersByName,
        });
        const season = teamSeason.getSeason();
        return [
            ...prev,
            ...season,
        ];
    }, []);

    console.log('Build: Teams end: ', new Date() - start);
    return allTeamPlayers.map((item, i) => {
        const data = {
            ...item,
            managerName: item.manager,
            manager___NODE: createNodeId(`managers-${item.manager}`),
            player___NODE: createNodeId(`players-${item.playerName}`),
        };
        return {
            resourceId: `teams-${i}-${data.manager}-${data.playerName}`,
            data,
            internal: {
                description: 'Teams',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.teams,
            },
        };
    });
};
