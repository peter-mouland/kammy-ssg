// const parseISO = require('date-fns/parseISO');
// const { getUtcDate, getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

// eslint-disable-next-line no-unused-vars
const getFixtures = (fplFixtures, fplTeams, gameWeek) =>
    fplFixtures
        .filter(({ data: item }) => item.event === gameWeek)
        .map(({ data }) => {
            const { data: aTeam } = fplTeams.find(({ data: { id } }) => data.team_a === id) || {};
            if (!aTeam) console.log(data);
            const { data: hTeam } = fplTeams.find(({ data: { id } }) => data.team_h === id) || {};
            if (!hTeam) console.log(data);
            return {
                ...data,
                awayTeam: aTeam,
                homeTeam: hTeam,
            };
        });

module.exports = ({ googleGameWeekData, fplFixtures, fplEvents, fplTeams }) => {
    const logEnd = logger.timed('Build: Game Weeks');

    let hasHadCurrent = false;
    let isNext = false;
    const finalEvent = fplEvents[fplEvents.length - 1]?.data;
    const finalStart = new Date(finalEvent?.deadline_time);
    const finalEnd = '2035-07-30T11:00:00.000Z';
    const finalIsCurrent = new Date() < finalEnd && new Date() > finalStart;
    const finalData = {
        fplEvent: finalEvent,
        cup: false,
        gameWeekIndex: fplEvents.length,
        start: finalStart,
        end: finalEnd,
        isCurrent: finalIsCurrent,
        isNext,
        hasPassed: !hasHadCurrent && !finalIsCurrent,
        fixtures: getFixtures(fplFixtures, fplTeams, fplEvents.length) || [],
    };
    const results = [...fplEvents, { data: finalData, isFinal: true }].map(({ data: event, isFinal }, i) => {
        const start = new Date(fplEvents[i - 1]?.data?.deadline_time || '2023-07-30T11:00:00.000Z');
        const ggw = googleGameWeekData.find((googleGameWeek) => String(googleGameWeek.gameweek) === String(i));
        const end = new Date(event.deadline_time);
        const isCurrent = new Date() < end && new Date() > start;
        const data = {
            fplEvent: event,
            cup: ['cup', 'y', 'yes', 'Y'].includes(ggw.cup || ''),
            gameWeekIndex: i,
            start,
            end,
            isCurrent,
            isFinal,
            isNext,
            hasPassed: !hasHadCurrent && !isCurrent,
            fixtures: getFixtures(fplFixtures, fplTeams, i) || [],
        };
        isNext = isCurrent;
        hasHadCurrent = isCurrent || hasHadCurrent;
        return {
            resourceId: `game-weeks-${i}`,
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
