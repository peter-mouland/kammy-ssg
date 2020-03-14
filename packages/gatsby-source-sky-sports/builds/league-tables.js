const { nodeTypes, mediaTypes } = require('../lib/constants');
const getPoints = require('./lib/calculate-division-points');
const getRank = require('./lib/calculate-division-rank');
const { positions } = require('./lib/positions');

module.exports = ({
  divisions, managers, teams, createNodeId,
}) => {
  console.log('Build: League Tables start');
  const start = new Date();
  const teamData = teams.map(({ data }) => data);
  const managerData = managers.map(({ data }) => data);
  const divisionData = divisions.map(({ data }) => data);
  const gameWeeks = [...new Set(teamData.map(p => p.gameWeek))];

  const results = [];
  gameWeeks.forEach((gameWeek) => {
    managerData.forEach(({ manager }) => {
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

  const ranks = [];
  gameWeeks.forEach((gameWeek) => {
    divisionData.forEach(({ key }) => {
      const managersInDivision = managerData.filter(({ divisionKey }) => divisionKey === key).map(({ manager }) => manager);
      const division = results.filter((team) => {
        return managersInDivision.includes(team.managerName) && team.gameWeek === gameWeek
      });
      ranks.push({ division: key, gameWeek, rank: getRank(division) });
    });
  });
  console.log(results[30])
  console.log(ranks[30])


  const ms = new Date() - start;
  console.log('Build: League Tables end: ', ms);

  return results.map((item, i) => {
      const data = {
        ...item,
        points: {
          ...item.points,
          gks,
        }
      };
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
