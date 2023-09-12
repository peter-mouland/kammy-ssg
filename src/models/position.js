// eslint-disable-next-line max-classes-per-file

class PositionCategory {
    constructor({ categoryId, label, displayOrder }) {
        this.categoryId = categoryId;
        this.id = categoryId;
        this.label = label;
        this.displayOrder = displayOrder;
    }
}

export class Position {
    constructor({ positionId, label, category, displayOrder, isPlayerPosition }) {
        this.positionId = positionId;
        this.id = positionId;
        this.label = label;
        this.isPlayerPosition = isPlayerPosition;
        this.displayOrder = displayOrder;
        this.category = new PositionCategory(category); // categoryId, label
    }
}

export default class Positions {
    positionCategories = [];
    playerPositions = [];
    all = [];
    byId = {};
    categoryById = {};
    constructor(positions, positionCategories) {
        positions.forEach((position) => {
            const pos = new Position(position);
            this.all.push(pos);
            if (pos.isPlayerPosition) this.playerPositions.push(pos);
            this.byId[pos.id] = pos;
        });

        positionCategories.forEach((position) => {
            const pos = new PositionCategory(position);
            this.positionCategories.push(pos);
            this.categoryById[pos.id] = pos;
        });
    }
}
