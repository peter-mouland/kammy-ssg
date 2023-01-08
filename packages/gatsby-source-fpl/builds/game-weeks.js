// const parseISO = require('date-fns/parseISO');
// const { getUtcDate, getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

// eslint-disable-next-line no-unused-vars
const getFixtures = (fplFixtures, fplTeams, { isCurrent, gameWeek, start, end }) =>
    fplFixtures
        .filter(({ data: item }) => {
            const fixtureDate = item.date;
            const result = start <= fixtureDate && fixtureDate <= end;
            return result;
        })
        .map(({ data }) => {
            const { data: aTeam } = fplTeams.find(({ data: { id } }) => data.team_a === id) || {};
            if (!aTeam) console.log(data);
            const { data: hTeam } = fplTeams.find(({ data: { id } }) => data.team_h === id) || {};
            if (!aTeam) console.log(data);
            return {
                ...data,
                aTid: aTeam?.id,
                aTcode: aTeam?.code,
                aScore: data.team_a_score,
                aTname: aTeam?.name,
                aTshortName: aTeam?.short_name,
                hTid: hTeam?.id,
                hTcode: hTeam?.code,
                hTname: hTeam?.name,
                hTshortName: hTeam?.short_name,
                hScore: data.team_h_score,
                status: data.finished,
            };
        });

module.exports = ({ googleGameWeekData, fplFixtures, fplTeams }) => {
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
        data.fixtures = getFixtures(fplFixtures, fplTeams, data) || [];
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
