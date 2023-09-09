/* eslint-env jest */
const { TeamByGameWeek, UNKNOWN_PLAYER } = require('./TeamByGameWeek');
const mockPlayer = require('./fixtures/player.json');
const teamFixture = require('./fixtures/team.json');
const gameWeeksFixture = require('./fixtures/gameweeks.json');

let gameWeeks;
let transfers;
let draft;
let playersByCode;
let teamSeason;
let startOfSeason;
let endOfSeason;
const GK = 'gk';

describe('TeamByGameWeek', () => {
    beforeEach(() => {
        draft = teamFixture;
        playersByCode = {
            ...mockPlayer,
        };
        gameWeeks = gameWeeksFixture;
        transfers = [
            {
                codeIn: '',
                codeOut: '',
                manager: 'Olly',
                status: 'Y',
                timestamp: '2018/08/12 18:00:00',
                transferInName: 'Zarate, Mauro',
                transferOutName: 'Lukaku, Romelu',
                type: 'Transfer',
            },
        ];
        startOfSeason = new Date(gameWeeks[0].start).setHours(0, 0, 0, 0);
        endOfSeason = new Date(gameWeeks[gameWeeks.length - 1].end).setHours(23, 59, 59, 999);
    });

    it('returns data', () => {
        teamSeason = new TeamByGameWeek({
            gameWeeks,
            draft,
            transfers,
            playersByCode,
        });
        expect(teamSeason).toHaveProperty('startOfSeason', startOfSeason);
        expect(teamSeason).toHaveProperty('endOfSeason', endOfSeason);
        expect(teamSeason).toHaveProperty('gameWeeks', gameWeeks);
        expect(teamSeason).toHaveProperty('getSeason');
        expect(teamSeason).toHaveProperty('draft', draft);
        expect(teamSeason).toHaveProperty('transfers', transfers);
    });

    describe('getPlayer()', () => {
        beforeEach(() => {
            teamSeason = new TeamByGameWeek({
                gameWeeks,
                playersByCode,
                transfers,
                draft,
            });
        });

        it('returns a default unknown player is passed', () => {
            expect(teamSeason.getPlayer({ code: '' })).toEqual(UNKNOWN_PLAYER(''));
        });

        it('returns a known player if matched', () => {
            expect(teamSeason.getPlayer({ code: '36' })).toEqual({
                name: 'de Gea, David',
                pos: GK,
                code: 36,
                club: 'Manchester United',
            });
        });
    });

    describe('getTransferList()', () => {
        it('returns a default unknown player with type as draft to say this player existed since draft day', () => {
            const player = {
                name: 'de Gea, David',
                pos: GK,
                code: 36,
                club: 'Manchester United',
            };
            teamSeason = new TeamByGameWeek({
                gameWeeks,
                playersByCode: { 36: player },
                transfers,
                draft,
            });
            expect(teamSeason.getTransferList(player)).toEqual([
                {
                    end: endOfSeason,
                    start: startOfSeason,
                    player,
                    playerOut: null,
                    type: 'draft',
                },
            ]);
        });

        it('returns a players transfers where dates match the transfer timestamp', () => {
            const player = {
                name: 'de Gea, David',
                pos: GK,
                code: 36,
                club: 'Manchester United',
            };
            teamSeason = new TeamByGameWeek({
                gameWeeks,
                players: {
                    36: player,
                    99: { name: 'Hernandez, Javier' },
                },
                transfers: [
                    {
                        ...transfers[0],
                        transferOutName: 'de Gea, David',
                        transferInName: 'Hernandez, Javier',
                    },
                ],
                draft,
            });
            expect(teamSeason.getTransferList(player)).toEqual([
                {
                    end: new Date(transfers[0].timestamp),
                    player,
                    playerOut: null,
                    start: startOfSeason,
                    type: 'draft',
                },
                {
                    end: endOfSeason,
                    player: { name: 'Hernandez, Javier' },
                    playerOut: player,
                    start: new Date(transfers[0].timestamp),
                    type: 'Transfer',
                },
            ]);
        });

        describe('type swap', () => {
            it('returns a players transfers where dates match the transfer timestamp', () => {
                const player = {
                    name: 'de Gea, David',
                    pos: GK,
                    code: 36,
                    club: 'Manchester United',
                };
                teamSeason = new TeamByGameWeek({
                    gameWeeks,
                    playersByCode: {
                        36: player,
                        99: { name: 'another player' },
                        999: { name: 'Hernandez, Javier' },
                    },
                    transfers: [
                        {
                            ...transfers[0],
                            type: 'Swap',
                            transferOutName: 'Hernandez, Javier',
                            transferInName: 'de Gea, David',
                        },
                    ],
                    draft,
                });
                expect(teamSeason.getTransferList(player)).toEqual([
                    {
                        end: new Date(transfers[0].timestamp),
                        player,
                        playerOut: null,
                        start: startOfSeason,
                        type: 'draft',
                    },
                    {
                        end: endOfSeason,
                        player: { name: 'Hernandez, Javier' },
                        playerOut: player,
                        start: new Date(transfers[0].timestamp),
                        type: 'Swap',
                    },
                ]);
            });
        });
    });

    describe('getSeason', () => {
        it('should return an array of gameWeeks', () => {
            teamSeason = new TeamByGameWeek({
                playersByCode,
                gameWeeks,
                transfers,
                draft,
            });
            expect(teamSeason.getSeason()).toHaveLength(gameWeeks.length);
            expect(teamSeason.getSeason()[0]).toHaveProperty('gameWeek', gameWeeksFixture[0].gameWeek);
            expect(teamSeason.getSeason()[0]).toHaveProperty('start', gameWeeksFixture[0].start);
            expect(teamSeason.getSeason()[0]).toHaveProperty('end', gameWeeksFixture[0].end);
        });

        it('should return each gameWeek with an array of team players', () => {
            teamSeason = new TeamByGameWeek({
                playersByCode,
                gameWeeks,
                transfers,
                draft,
            });
            expect(Object.keys(teamSeason.getSeason()[0].players)).toHaveLength(draft.length);
        });

        it('should return players', () => {
            teamSeason = new TeamByGameWeek({
                playersByCode,
                gameWeeks,
                transfers,
                draft,
            });
            expect(teamSeason.getSeason()[0].players['36']).toHaveProperty('name', 'de Gea, David');
            expect(teamSeason.getSeason()[0].players['36']).toHaveProperty('club', 'Manchester United');
            expect(teamSeason.getSeason()[0].players['36']).toHaveProperty('posisitionId', GK);
            expect(teamSeason.getSeason()[0].players['36']).toHaveProperty('managerId', 'Olly');
            expect(teamSeason.getSeason()[0].players['36']).toHaveProperty('code', 36);
        });
    });
});
