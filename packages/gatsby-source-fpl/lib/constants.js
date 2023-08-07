module.exports = {
    spreadsheets: {
        // also kammy-ssg/packages/helpers/spreadsheet/src/constants.js
        ACCESS_KEY: 'AIzaSyDA7UXEi96G7qFNIdgMg6nVJW9OajORO-I', // key to get json
        TRANSFERS_ID: '1sU3xKfpOD6m3hdYqddfMXpVmvkJu4_LdUnJd1YLzU9U', // transfers
        SETUP_ID: '19uzl1nYi6ZFsFhim4-wm-ztVWazYAshKU0eca7FSwHw', // game-weeks, players, teams + draft picks
    },
    nodeTypes: {
        teams: 'teams',
        leagueTable: 'leagueTable',
        draft: 'draft',
        managers: 'managers',
        divisions: 'divisions',
        players: 'players',
        gameWeeks: 'gameWeeks',
        cup: 'cup',
        transfers: 'transfers',
        skySportsFixtures: 'skySportsFixtures',
        skySportsScores: 'skySportsScores',
        skySportsPlayers: 'skySportsPlayers',
        skySportsPlayerStats: 'skySportsPlayerStats',
        adminPlayersList: 'adminPlayersList',
        fplPositions: 'fplPositions',
        fplEvents: 'fplEvents',
        fplTeams: 'fplTeams',
        fplFixtures: 'fplFixtures',
        fplScores: 'fplScores',
        fplPlayers: 'fplPlayers',
        fplPlayerStats: 'fplPlayerStats',
    },
    mediaTypes: {
        IMG: (type) => `image/${type}`,
        JSON: 'application/json',
        MDX: 'text/markdown',
    },
};
