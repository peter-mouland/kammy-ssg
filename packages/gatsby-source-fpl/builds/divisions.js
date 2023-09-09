const { nodeTypes, mediaTypes } = require('../lib/constants');

module.exports = ({ googleDivisionData }) =>
    googleDivisionData.map((division) => {
        const data = {
            divisionId: division.id,
            label: division.label,
            order: division.order,
            spreadsheetKey: division.spreadsheetKey,
            url: division.url,
        };
        return {
            resourceId: `divisions-${division.id}`,
            data,
            internal: {
                description: 'Divisions',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.divisions,
            },
        };
    });
