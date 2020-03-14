const { nodeTypes, mediaTypes } = require('../lib/constants');
const getPoints = require('./lib/calculate-division-points');

module.exports = ({
    teams, createNodeId,
}) => {
  console.log('Build: League Tables start');
  const start = new Date();
  const teamData = teams.map(({ data }) => data);
  const managers = [...new Set(teamData.map(p => p.manager))];
  const gameWeeks = [...new Set(teamData.map(p => p.gameWeek))];

  const results = [];
  managers.forEach((manager) => {
    gameWeeks.forEach((gameWeek) => {
      const team = teamData.filter((team) => team.manager === manager && team.gameWeek === gameWeek);
      const points = getPoints(team);
      results.push({
        gameWeek,
        managerName: manager,
        manager___NODE: createNodeId(`managers-${manager}`),
        points,
      })
    });
  });
  const ms = new Date() - start;
  console.log('Build: League Tables end: ', ms);

  return results.map((item, i) => {
      const data = item;
      return {
          resourceId: `league-tables-i${i}-${data.teamPos}-${data.manager}-${data.gameWeek}`,
          data,
          internal: {
              description: 'League Tables',
              mediaType: mediaTypes.JSON,
              type: nodeTypes.leagueTable,
          },
      };
  });
};
