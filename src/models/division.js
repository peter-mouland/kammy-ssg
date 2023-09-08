// eslint-disable-next-line max-classes-per-file
class Division {
    constructor({ id, label, displayOrder, url, spreadsheetKey }) {
        this.id = id;
        this.label = label;
        this.displayOrder = displayOrder;
        this.url = url;
        this.spreadSheetKey = spreadsheetKey;
        this.managers = [];
    }

    addManager(Manager) {
        this.managers.push(Manager);
    }
}

export default class Divisions {
    byId = {};
    constructor() {
        // todo fetch from excel + cache?
        this.byId.premierLeague = new Division({
            id: 'premierLeague',
            displayOrder: 0,
            label: 'Premier League',
            spreadsheetKey: 'premierLeague',
            url: '/premier-league',
        });
        this.byId.championship = new Division({
            id: 'championship',
            displayOrder: 1,
            label: 'Championship',
            spreadsheetKey: 'championship',
            url: '/championship',
        });
        this.byId.leagueOne = new Division({
            id: 'leagueOne',
            displayOrder: 2,
            label: 'League One',
            spreadsheetKey: 'leagueOne',
            url: '/league-one',
        });
        this.all = [this.byId.premierLeague, this.byId.championship, this.byId.leagueOne];
    }

    getAll() {
        return this.all;
    }
}
