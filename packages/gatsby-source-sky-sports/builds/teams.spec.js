/* eslint-env jest */
const buildTeams = require('./teams');
const draftFixtures = require('./team-fixtures/draft.json');
const gameWeekFixtures = require('./team-fixtures/gameWeeks.json');
const managersFixtures = require('./team-fixtures/managers.json');
const playersFixtures = require('./team-fixtures/players.json');
const playerFixture = require('./team-fixtures/player.json');
const transfersFixtures = require('./team-fixtures/transfers.json');

const { log } = console;

describe('build teams', () => {
    beforeAll(() => {
        console.log = jest.fn;
    });
    afterAll(() => {
        console.log = log;
    });

    it('returns an array by default', () => {
        const result = buildTeams({
            draft: [],
            transfers: [],
            gameWeeks: [],
            players: [],
            managers: [],
            createNodeId: jest.fn(),
        });
        expect(result).toStrictEqual([]);
    });

    it('returns a basic team', () => {
        const result = buildTeams({
            draft: draftFixtures,
            transfers: [],
            gameWeeks: gameWeekFixtures,
            players: playersFixtures,
            managers: managersFixtures,
            createNodeId: jest.fn(),
        });
        console.log(result);
        // expect(result).toStrictEqual([]);
    });
});
