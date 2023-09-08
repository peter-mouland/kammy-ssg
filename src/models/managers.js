// eslint-disable-next-line max-classes-per-file
class Manager {
    Squad = undefined;

    constructor({ id, label, url, divisionId }) {
        this.id = id;
        this.label = label;
        this.url = `/${url ?? id}`;
        this.divisionId = divisionId;
    }

    addSquad(Squad) {
        this.Squad = Squad;
    }
}

export default class Managers {
    all = [];
    byDivisionId = {};
    byId = {};
    constructor(managers) {
        managers.forEach((manager) => this.addManager(manager));
        this.setByDivision();
    }

    addManager(props) {
        const manager = new Manager(props);
        this.all.push(manager);
        this.byId[manager.id] = manager;
    }

    setByDivision() {
        this.byDivisionId = this.all.reduce((prev, manager) => {
            // eslint-disable-next-line no-param-reassign
            prev[manager.divisionId] ??= [];
            prev[manager.divisionId].push(manager);
            return prev;
        }, {});
    }

    getAll() {
        return this.all;
    }
}
