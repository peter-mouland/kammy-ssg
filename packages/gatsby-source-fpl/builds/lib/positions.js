const positions = [
    { key: 'gks', label: 'GK / SUB', teamPos: ['GK', 'SUB'] },
    { key: 'cb', label: 'CB', teamPos: ['CB'] },
    { key: 'fb', label: 'FB', teamPos: ['FB'] },
    { key: 'mid', label: 'MID', teamPos: ['MID'] },
    { key: 'am', label: 'AM', teamPos: ['AM'] },
    { key: 'str', label: 'STR', teamPos: ['STR', 'FWD'] },
];

module.exports.getPositionLabel = (teamPos) => positions.find((position) => position.teamPos.includes(teamPos));

module.exports.positions = positions;
