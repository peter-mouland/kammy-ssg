module.exports = {
    spreadsheets: {
      ACCESS_KEY: 'AIzaSyDA7UXEi96G7qFNIdgMg6nVJW9OajORO-I', // key to get json
      TRANSFERS_ID: '10xathUydH-GDTLjngRXioaUVqBZoiZqfjfM6fhgUcYk', // transfers
      DRAFT_ID: '1gVEHnzHPfSR7isLNfxJxq8DKKLY4mKeiffwUb7YfFlc', // teams + draft picks
      SETUP_ID: '1HoInFwqCFLSl0yh8JBvQEFFjOg5ImiiT-BY_aDCy0AU', // game-weeks + players
    },
    nodeTypes: {
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
        JSON: `application/json`,
        MDX: `text/markdown`,
    },
};
