// eslint-disable-next-line import/prefer-default-export
export class Stats {
    all = [];
    constructor(stats = {}) {
        this.points = { id: 'points', label: 'Points', displayOrder: 0, value: stats.points };
        this.apps = { id: 'apps', label: 'Mins', displayOrder: 1, value: stats.apps };
        this.gls = { id: 'gls', label: 'Gls', displayOrder: 2, value: stats.gls };
        this.asts = { id: 'asts', label: 'Asts', displayOrder: 3, value: stats.asts };
        this.cs = { id: 'cs', label: 'Cs', displayOrder: 4, value: stats.cs };
        this.con = { id: 'con', label: 'Con', displayOrder: 5, value: stats.con };
        this.pensv = { id: 'pensv', label: 'Pensv', displayOrder: 6, value: stats.pensv };
        this.ycard = { id: 'ycard', label: 'YCard', displayOrder: 7, value: stats.ycard };
        this.rcard = { id: 'rcard', label: 'RCard', displayOrder: 8, value: stats.rcard };
        this.bp = { id: 'bp', label: 'Bp', displayOrder: 8, value: stats.bp };
        this.sb = { id: 'sb', label: 'Sv', displayOrder: 9, value: stats.sb };

        this.all = [
            this.points,
            this.apps,
            this.gls,
            this.asts,
            this.cs,
            this.con,
            this.pensv,
            this.ycard,
            this.rcard,
            this.bp,
            this.sb,
        ];
    }
}
