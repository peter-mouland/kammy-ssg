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
                aTid: aTeam?.id,
                aTcode: aTeam?.code,
                aScore: data.team_a_score || 0, // must have default for start of season so gatsby inferred schemas don't fuck up
                team_a_score: data.team_a_score || 0,
                aTname: aTeam?.name,
                aTshortName: aTeam?.short_name,
                hTid: hTeam?.id,
                hTcode: hTeam?.code,
                hTname: hTeam?.name,
                hTshortName: hTeam?.short_name,
                hScore: data.team_h_score || 0,
                team_h_score: data.team_h_score || 0,
                status: data.finished || false,
            };
        });

module.exports = ({ googleGameWeekData, fplFixtures, fplEvents, fplTeams }) => {
    const logEnd = logger.timed('Build: Game Weeks');

    const results = fplEvents.map(({ data: event }, i) => {
        const start = new Date(fplEvents[i - 1]?.data?.deadline_time || '2023-07-30T11:00:00.000Z');
        const ggw = googleGameWeekData.find((googleGameWeek) => String(googleGameWeek.gameweek) === String(i));
        const end = new Date(event.deadline_time);
        const data = {
            ...event,
            cup: ['cup', 'y', 'yes', 'Y'].includes(ggw.cup || ''),
            gameWeek: i,
            startString: start,
            endString: event.deadline_time,
            start, // 11am on gsheets, 10am as new date(), back to 11am
            end,
            isCurrent: new Date() < end && new Date() > start,
            fixtures: getFixtures(fplFixtures, fplTeams, i) || [],
        };
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
