// eslint-disable-next-line max-classes-per-file
class Manager {
    Squad = undefined;

    constructor({ managerId, label, divisionId }) {
        this.managerId = managerId.replace(/ /g, '-').toLowerCase();
        this.id = this.managerId; // shorthand alias
        this.label = label;
        this.url = `/${managerId.replace(/ /g, '-').toLowerCase()}`;
        this.divisionId = divisionId;
    }
}

export default class Managers {
    all = [];
    manager = [];
    byDivisionId = {};
    byId = {};
    constructor(managers) {
        managers.forEach((manager) => this.addManager(manager));
    }

    addManager(props) {
        const manager = new Manager(props);
        this.all.push(manager);
        this.byId[manager.id] = manager;
        this.byDivisionId[manager.divisionId] ??= [];
        this.byDivisionId[manager.divisionId].push(manager);
        this.byDivisionId[manager.divisionId].sort();
    }

    getManager(managerId) {
        return this.byId[managerId];
    }

    getManagersInDivision(divisionId) {
        return this.byDivisionId[divisionId];
    }
}
