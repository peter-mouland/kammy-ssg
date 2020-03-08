const skySportsFixtures = 'skySportsFixtures';
const skySportsScores = 'skySportsScores';
const skySportsPlayers = 'skySportsPlayers';
const skySportsPlayerFixtures = 'skySportsPlayerFixtures';

module.exports = {
    nodeTypes: {
      skySportsFixtures,
      skySportsScores,
      skySportsPlayers,
      skySportsPlayerFixtures,
    },
    mediaTypes: {
        IMG: (type) => `image/${type}`,
        JSON: `application/json`,
        MDX: `text/markdown`,
    },
};
