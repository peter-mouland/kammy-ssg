module.exports = {
    spreadsheets: {
        ACCESS_KEY: 'AIzaSyDA7UXEi96G7qFNIdgMg6nVJW9OajORO-I', // key to get json
        TRANSFERS_ID: '1B5WBkm7bHmRsee3eCk7-X2e-lzqnXEWNnc7H55oULYo', // transfers
        DRAFT_ID: '1UKOeKiApAoNMXj8id3wfaTq9HrO2zHz5_yO2TqCah7c', // teams + draft picks
        SETUP_ID: '1TbZVhvjOD8noHCQ-LkKZYWPTdb7DDmoY13xIQSINn2g', // game-weeks + players
        season2021: {
            TRANSFERS_ID: '1Bxwu_QGjO6YDLyJyByl4Yhhltbcpxcve8H2dUYZ5NNo', // transfers
            DRAFT_ID: '1vtP55at4LszC3rM8va4oshzlnEE7c5X3tYsOiFOudbk', // teams + draft picks
            SETUP_ID: '1v_NHXfYGSzmIer0xO2frLvRxiE3N13JXpEvgMVyHlVI', // game-weeks + players
        },
        season1920: {
            TRANSFERS_ID: '1B5WBkm7bHmRsee3eCk7-X2e-lzqnXEWNnc7H55oULYo', // transfers
            DRAFT_ID: '1UKOeKiApAoNMXj8id3wfaTq9HrO2zHz5_yO2TqCah7c', // teams + draft picks
            SETUP_ID: '1TbZVhvjOD8noHCQ-LkKZYWPTdb7DDmoY13xIQSINn2g', // game-weeks + players
        },
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
