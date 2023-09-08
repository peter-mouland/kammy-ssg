// eslint-disable-next-line max-classes-per-file
class Position {
    constructor({ id, label, displayOrder }) {
        this.id = id;
        this.label = label;
        this.displayOrder = displayOrder;
    }

    setCategory(Category) {
        this.Category = Category;
    }
}

class PositionCategory extends Position {
    constructor({ id, label, displayOrder, positions }) {
        super({ id, label, displayOrder });
        this.positions = positions;
    }
}

export default class Positions {
    constructor() {
        const GK = new Position({ id: 'gk', displayOrder: 0, label: 'GK' });
        const CB = new Position({ id: 'cb', displayOrder: 1, label: 'CB' });
        const FB = new Position({ id: 'fb', displayOrder: 2, label: 'FB' });
        const MID = new Position({ id: 'mid', displayOrder: 3, label: 'MID' });
        const AM = new Position({ id: 'am', displayOrder: 4, label: 'AM' });
        const STR = new Position({ id: 'str', displayOrder: 5, label: 'STR' });
        const SUB = new Position({ id: 'sub', displayOrder: 6, label: 'SUB' });

        const gksCategory = new PositionCategory({
            id: 'gks',
            displayOrder: 0,
            label: 'GK / Sub',
            positions: [GK, SUB],
        });
        const cbCategory = new PositionCategory({ id: 'cb', displayOrder: 1, label: 'CB', positions: [CB] });
        const fbCategory = new PositionCategory({ id: 'fb', displayOrder: 2, label: 'FB', positions: [FB] });
        const midCategory = new PositionCategory({ id: 'mid', displayOrder: 3, label: 'MID', positions: [MID] });
        const amCategory = new PositionCategory({ id: 'am', displayOrder: 4, label: 'AM', positions: [AM] });
        const strCategory = new PositionCategory({ id: 'str', displayOrder: 5, label: 'STR', positions: [STR] });

        GK.setCategory(gksCategory);
        CB.setCategory(cbCategory);
        FB.setCategory(fbCategory);
        MID.setCategory(midCategory);
        AM.setCategory(amCategory);
        STR.setCategory(strCategory);
        SUB.setCategory(gksCategory);

        this.GK = GK;
        this.CB = CB;
        this.FB = FB;
        this.MID = MID;
        this.AM = AM;
        this.STR = STR;
        this.SUB = SUB;
        this.PlayerPositions = [GK, CB, FB, MID, AM, STR];
        this.SquadPositions = [GK, CB, FB, MID, AM, STR, SUB];
        this.PositionCategories = [gksCategory, cbCategory, fbCategory, midCategory, amCategory, strCategory];
    }
}
