// eslint-disable-next-line max-classes-per-file
export class Manager {
    managerId: string;
    id: string;
    label: string;
    url: string;
    divisionId: string;
    constructor({ managerId, label, divisionId }: Manager) {
        this.managerId = managerId.replace(/ /g, '-').toLowerCase();
        this.id = this.managerId; // shorthand alias
        this.label = label;
        this.url = `/${managerId.replace(/ /g, '-').toLowerCase()}`;
        this.divisionId = divisionId;
    }
}

export default class Managers {
    all: Manager[] = [];
    manager = [];
    byDivisionId: Record<string, Manager[]> = {};
    byId: Record<string, Manager> = {};
    constructor(managers: Manager[]) {
        managers.forEach((manager) => this.addManager(manager));
    }

    addManager(props: Manager) {
        const manager = new Manager(props);
        this.all.push(manager);
        this.byId[manager.id] = manager;
        this.byDivisionId[manager.divisionId] ??= [];
        this.byDivisionId[manager.divisionId].push(manager);
        this.byDivisionId[manager.divisionId].sort();
    }

    getManager(managerId: Manager['id']) {
        return this.byId[managerId];
    }

    getManagersInDivision(divisionId: Manager['divisionId']) {
        return this.byDivisionId[divisionId];
    }
}
