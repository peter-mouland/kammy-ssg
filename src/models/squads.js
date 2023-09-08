export default class Squad {
    constructor({ Manager, url, Division }) {
        this.Division = Division;
        this.Manager = Manager;
        this.url = `/${url}`;
        this.players = [];
    }

    addPlayer(Player, SquadPos, positionIndex) {
        this.players.push({ Player, SquadPos, positionIndex });
    }
}
