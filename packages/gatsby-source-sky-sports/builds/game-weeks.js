const parseISO = require('date-fns/parseISO');
const { getUtcDate, getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

const getFixtures = (skyFixtures, { start, end }) =>
    skyFixtures
        .filter(({ data: item }) => {
            const fixtureDate = item.date;
            const result = start <= fixtureDate && fixtureDate <= end;
            return result;
        })
        .map(({ data }) => data);

module.exports = ({ googleGameWeekData, skyFixtures }) => {
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
            // startParseIso: parseISO(gw.start),
            // endParseIso: parseISO(gw.end),
            // startUTC: getUtcDate(gw.start),
            // endUTC: getUtcDate(gw.end),
            // startGMT: getGmtDate(gw.start),
            // endGMT: getGmtDate(gw.end),
        };
        data.isCurrent = new Date() < data.end && new Date() > data.start;
        data.fixtures = getFixtures(skyFixtures, data);
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
