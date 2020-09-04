const { nodeTypes, mediaTypes } = require('../lib/constants');
const toDate = require('../lib/to-date');
const logger = require('../lib/log');

const getFixtures = (skyFixtures, { start, end }) =>
    skyFixtures
        .filter(({ data: item }) => {
            const fixtureDate = toDate(item.date);
            const endDate = toDate(end);
            const startDate = toDate(start);
            return fixtureDate <= endDate && fixtureDate >= startDate;
        })
        .map(({ data }) => data);

module.exports = ({ googleGameWeekData, skyFixtures }) => {
    const logEnd = logger.timed('Build: Game Weeks');

    const results = googleGameWeekData.map((gw) => {
        const data = {
            notes: gw.notes || '',
            cup: ['cup', 'y', 'yes', 'Y'].includes(gw.cup || ''),
            gameWeek: parseInt(gw.gameweek, 10),
            start: gw.start,
            end: gw.end,
            isCurrent: new Date() < new Date(gw.end) && new Date() > new Date(gw.start),
            fixtures: getFixtures(skyFixtures, gw),
        };
        return {
            resourceId: `game-weeks-${gw.gameweek}`,
            data,
            internal: {
                description: 'Game Weeks',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.gameWeeks,
            },
        };
    });
    logEnd();
    return results;
};
