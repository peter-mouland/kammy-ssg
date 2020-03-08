const { nodeTypes, mediaTypes } = require('../lib/constants');


function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

const mapToFFDataStructure = (prev, curr) => ({
  ...prev,
  [`${curr.sName}, ${curr.fName}`.trim()]: {
    code: parseInt(curr.id, 10),
    name: `${curr.sName}, ${curr.fName}`.trim(),
    skySportsPosition: curr.group.toUpperCase(),
    skySportsClub: toTitleCase(curr.tName),
    value: parseFloat(curr.value),
    new: false,
    isHidden: false,
    fixtures: curr.fixtures || [],
    stats: curr.stats,
  },
});

module.exports = ({ playerData }) => {
  return playerData
    .map((data) => {
        return {
            resourceId: `skysports-${data.id}-${data.locale}`,
            data: {
                ...data,
            },
            internal: {
                description: 'Sky Sports data',
                mediaType: mediaTypes.JSON,
                type: nodeTypes.skySportsPlayerFixtures,
            },
        };
    });
};

