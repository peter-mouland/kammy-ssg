// const { getGmtDate } = require('@kammy/helpers.get-gmt-date');

const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

module.exports = ({ teams, teamsByCode, elements, elementTypesById, events }) => {
    const logEnd = logger.timed('Build: FPL');

    const skyPlayers = elements.map((element) => {
        const data = {
            ...elements,
            name: `${element.second_name}, ${element.first_name}`.trim(),
            code: parseInt(elements.code, 10),
            pos: elementTypesById[elements.emlement_type],
            club: teamsByCode[elements.team_code],
            stats: [],
            // fixtures: elements.fixtures.map((fixture) => ({
            //     ...fixture,
            //     date: getGmtDate(fixture.date),
            // })),
            tCode: elements.tCode,
        };

        return {
            resourceId: `fpl-players-${data.name}`,
            data,
            internal: {
                description: 'FPL data',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.fplPlayers,
            },
        };
    });
    logEnd();
    return skyPlayers;
};
