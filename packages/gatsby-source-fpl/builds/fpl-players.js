/* eslint-disable no-console */
const { getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ teamsByCode, elements, elementTypesById }) => {
    const logEnd = logger.timed('Build: FPL');
    const fplPlayers = elements.map((element) => {
        if (!elementTypesById[element.element_type]) {
            logger.error('POS not found');
            logger.error(element.element_type);
            // console.log(elementTypesById);
        }
        if (!teamsByCode[element.team_code]) {
            logger.error('Team not found');
            logger.error(element.team_code);
            // console.log(teamsByCode);
        }

        const data = {
            ...element,
            code: parseInt(element.code, 10),
            fplPosition: elementTypesById[element.element_type].pos,
            club: teamsByCode[element.team_code].name,
            fixtures: element.fixtures.map((fixture) => ({
                ...fixture,
                date: getGmtDate(fixture.kickoff_time),
            })),
            stats: element.stats.map((fixture) => ({
                ...fixture,
                date: getGmtDate(fixture.kickoff_time),
            })),
        };

        return {
            resourceId: `fpl-players-${data.code}`,
            data,
            internal: {
                description: 'FPL data',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.fplPlayers,
            },
        };
    });
    logEnd();
    return fplPlayers;
};
