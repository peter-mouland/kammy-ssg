module.exports = {
    spreadsheets: {
        ACCESS_KEY: 'AIzaSyDA7UXEi96G7qFNIdgMg6nVJW9OajORO-I', // key to get json
        TRANSFERS_ID: '14laYRwz5EEorx3DRygOrztBApg3DWac6-0gz43XUzk4', // transfers
        SETUP_ID: '1p1ICFDYdONIri91zCiW-ATBLXavpriECYP7fmd-r4oc', // game-weeks, players, teams + draft picks
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
