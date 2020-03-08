module.exports = {
    spreadsheets: {
      ACCESS_KEY: 'AIzaSyDA7UXEi96G7qFNIdgMg6nVJW9OajORO-I',
      TRANSFERS_ID: '10xathUydH-GDTLjngRXioaUVqBZoiZqfjfM6fhgUcYk',
      DRAFT_ID: '1gVEHnzHPfSR7isLNfxJxq8DKKLY4mKeiffwUb7YfFlc', // teams + draft picks
      SETUP_ID: '1HoInFwqCFLSl0yh8JBvQEFFjOg5ImiiT-BY_aDCy0AU', // game-weeks + players
    },
    nodeTypes: {
      divisions: 'divisions',
      players: 'players',
      gameWeeks: 'gameWeeks',
      cup: 'cup',
      transfers: 'transfers',
      skySportsFixtures: 'skySportsFixtures',
      skySportsScores: 'skySportsScores',
      skySportsPlayers: 'skySportsPlayers',
      skySportsPlayerFixtures: 'skySportsPlayerFixtures',
    },
    mediaTypes: {
        IMG: (type) => `image/${type}`,
        JSON: `application/json`,
        MDX: `text/markdown`,
    },
};
