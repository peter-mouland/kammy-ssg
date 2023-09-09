const positions = [
    { key: 'gks', label: 'GK / SUB', squadPositionId: ['gk', 'sub'] },
    { key: 'cb', label: 'CB', squadPositionId: ['cb'] },
    { key: 'fb', label: 'FB', squadPositionId: ['fb'] },
    { key: 'mid', label: 'MID', squadPositionId: ['mid'] },
    { key: 'am', label: 'AM', squadPositionId: ['am'] },
    { key: 'str', label: 'STR', squadPositionId: ['str', 'fwd'] },
];

module.exports.getPositionLabel = (squadPositionId) =>
    positions.find((position) => position.squadPositionId.includes(squadPositionId));

module.exports.positions = positions;
