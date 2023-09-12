export class Division {
    divisionId: string;
    id: string; // shorthand alias
    label: string;
    order: number;
    url: string;
    spreadsheetKey: string;
    managers = [];

    constructor({ divisionId, label, order, url, spreadsheetKey }: Division) {
        this.divisionId = divisionId;
        this.id = divisionId; // shorthand alias
        this.label = label;
        this.order = order;
        this.url = url;
        this.spreadsheetKey = spreadsheetKey;
        this.managers = [];
    }

    addManager(Manager) {
        this.managers.push(Manager);
    }
}

export default class Divisions {
    byId: Record<Division['id'], Division> = {};
    all: Division[] = [];
    constructor(divisions: Division[]) {
        divisions.forEach((division) => {
            const div = new Division(division);
            this.all.push(div);
            this.byId[div.id] = div;
        });
        this.all.sort((a, b) => (a.order < b.order ? -1 : 1));
    }

    getAll() {
        return this.all;
    }

    getDivision(divisionId: Division['divisionId']) {
        return this.byId[divisionId];
    }
}
