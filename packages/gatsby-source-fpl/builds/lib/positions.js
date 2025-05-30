const positions = [
    { positionId: 'gk', displayOrder: 0, label: 'GK', category: 'gks', isPlayerPosition: true },
    { positionId: 'cb', displayOrder: 1, label: 'CB', category: 'cb', isPlayerPosition: true },
    { positionId: 'fb', displayOrder: 2, label: 'FB', category: 'fb', isPlayerPosition: true },
    { positionId: 'mid', displayOrder: 3, label: 'MID', category: 'mid', isPlayerPosition: true },
    { positionId: 'wa', displayOrder: 4, label: 'WA', category: 'wa', isPlayerPosition: true },
    { positionId: 'ca', displayOrder: 5, label: 'CA', category: 'ca', isPlayerPosition: true },
    { positionId: 'sub', displayOrder: 6, label: 'SUB', category: 'gks', isPlayerPosition: false },
];

const positionCategories = [
    { categoryId: 'gks', displayOrder: 0, label: 'GK / Sub' },
    { categoryId: 'cb', displayOrder: 1, label: 'CB' },
    { categoryId: 'fb', displayOrder: 2, label: 'FB' },
    { categoryId: 'mid', displayOrder: 3, label: 'MID' },
    { categoryId: 'wa', displayOrder: 4, label: 'WA' },
    { categoryId: 'ca', displayOrder: 5, label: 'CA' },
];

module.exports.getPosition = (squadPositionId) => positions.find((position) => position.positionId === squadPositionId);

module.exports.positions = positions;
module.exports.positionCategories = positionCategories;
