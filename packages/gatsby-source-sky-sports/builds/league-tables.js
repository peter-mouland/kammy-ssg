const TeamByGameWeek = require('./lib/TeamByGameWeek');
const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({
    draft, transfers, gameWeeks, players, managers, createNodeId,
}) => {
  // extract the data from the node
  const gameWeekData = gameWeeks.map(({ data }) => data);
  const transferData = transfers.map(({ data }) => data);
  const playerData = players.map(({ data }) => data);
  const managerData = managers.map(({ data }) => data);
  const draftData = draft.map(({ data }) => data);

  // filter and set required vard
  const validTransfers = transferData.filter((transfer) => transfer.isValid);
  const pendingTransfers = transferData.filter((transfer) => transfer.isPending);
  const getValidManagerTransfers = (manager) => validTransfers.filter((transfer) => transfer.manager === manager);
  const currentGameWeek = (gameWeekData.find((gameWeek) => gameWeek.isCurrent) || {});
  const playersByManager = draftData.reduce((prev, { manager }) => ({
    ...prev,
    [manager]: draftData.filter((pick) => pick.manager === manager),
  }), {});
  const playersByName = playerData.reduce((prev, player) => ({
    ...prev,
    [player.name]: { ...player },
  }), {});

  const allTeams = managerData.reduce((prev, { manager }) => {
    const team = new TeamByGameWeek({
      draft: playersByManager[manager],
      transfers: getValidManagerTransfers(manager),
      gameWeeks: gameWeekData,
      players: playersByName,
    });
    return {
      ...prev,
      [manager]: team.getSeason(),
    };
  }, {});
  const teamsByGameWeek = gameWeekData.map((gameWeek) => {
    const gameWeekPlayers = Object.keys(allTeams).map((manager) => (
      allTeams[manager].find((week) => gameWeek.gameWeek === week.gameWeek).players
    ));
    return ({
      ...gameWeek,
      players: [].concat.apply([], gameWeekPlayers),
    });
  });
  const currentTeams = teamsByGameWeek.find(({ gameWeek }) => (
    parseInt(gameWeek, 10) === parseInt(currentGameWeek.gameWeek), 10),
  );

  return teamsByGameWeek.map((item, index) => {
      const data = {
        ...item,
        gameWeek: index,
      };
      return {
          resourceId: `league-tables-gw${index}`,
          data: {
            ...data,
            // player___NODE: createNodeId(`players-${item.name}`)
          },
          internal: {
              description: 'League Tables',
              mediaType: mediaTypes.JSON,
              type: nodeTypes.leagueTable,
          },
      };
  });
};
