module.exports = {
    spreadsheets: {
        ACCESS_KEY: 'AIzaSyDA7UXEi96G7qFNIdgMg6nVJW9OajORO-I', // key to get json
        // TRANSFERS_ID: '10xathUydH-GDTLjngRXioaUVqBZoiZqfjfM6fhgUcYk', // transfers
        // DRAFT_ID: '1gVEHnzHPfSR7isLNfxJxq8DKKLY4mKeiffwUb7YfFlc', // teams + draft picks
        // SETUP_ID: '1HoInFwqCFLSl0yh8JBvQEFFjOg5ImiiT-BY_aDCy0AU', // game-weeks + players
        TRANSFERS_ID: '1Bxwu_QGjO6YDLyJyByl4Yhhltbcpxcve8H2dUYZ5NNo', // transfers
        DRAFT_ID: '1vtP55at4LszC3rM8va4oshzlnEE7c5X3tYsOiFOudbk', // teams + draft picks
        SETUP_ID: '1v_NHXfYGSzmIer0xO2frLvRxiE3N13JXpEvgMVyHlVI', // game-weeks + players
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
    },
    mediaTypes: {
        IMG: (type) => `image/${type}`,
        JSON: 'application/json',
        MDX: 'text/markdown',
    },
};
