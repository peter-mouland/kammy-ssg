// const parseISO = require('date-fns/parseISO');
// const { getUtcDate, getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

const getFixtures = (fplFixtures, { start, end }) =>
    fplFixtures
        .filter(({ data: item }) => {
            const fixtureDate = item.kickoff_time;
            const result = start <= fixtureDate && fixtureDate <= end;
            return result;
        })
        .map(({ data }) => data);

module.exports = ({ googleGameWeekData, fplFixtures }) => {
    const logEnd = logger.timed('Build: Game Weeks');

    const results = googleGameWeekData.map((gw) => {
        const data = {
            notes: gw.notes || '',
            cup: ['cup', 'y', 'yes', 'Y'].includes(gw.cup || ''),
            gameWeek: parseInt(gw.gameweek, 10),
            startString: gw.start,
            endString: gw.end,
            start: new Date(gw.start), // 11am on gsheets, 10am as new date(), back to 11am
            end: new Date(gw.end),
        };
        data.isCurrent = new Date() < data.end && new Date() > data.start;
        data.fixtures = getFixtures(fplFixtures, data) || [];
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