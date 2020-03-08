/* eslint-env jest */
import TeamByGameWeek, { UNKNOWN_PLAYER } from './TeamByGameWeek';

let gameWeeks;
let transfers;
let draft;
let players;
let teamSeason;
let startOfSeason;
let endOfSeason;

const mockPlayer = require('../../../fixtures/player.json');
const teamFixture = require('../../../fixtures/team.json');
const gameWeeksFixture = require('../../../fixtures/gameweeks.json');

describe('TeamByGameWeek', () => {
  beforeEach(() => {
    draft = teamFixture;
    players = {
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
        transferIn: 'Zarate, Mauro',
        transferOut: 'Lukaku, Romelu',
        type: 'Transfer',
      },
    ];
    startOfSeason = new Date(gameWeeks[0].start).setHours(0, 0, 0, 0);
    endOfSeason = new Date(gameWeeks[gameWeeks.length - 1].end).setHours(23, 59, 59, 999);
  });

  it('returns data', () => {
    teamSeason = new TeamByGameWeek({
      gameWeeks, draft, transfers, players,
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
        gameWeeks, players, transfers, draft,
      });
    });

    it('returns a default unknown player is passed', () => {
      expect(teamSeason.getPlayer({ name: '' })).toEqual(UNKNOWN_PLAYER(''));
    });

    it('returns a known player if matched', () => {
      const player = {
        name: 'de Gea, David',
        pos: 'GK',
        code: 36,
        club: 'Manchester United',
      };
      expect(teamSeason.getPlayer({ name: 'de Gea, David' })).toEqual(player);
    });
  });

  describe('getTransferList()', () => {
    it('returns a default unknown player with type as draft to say this player existed since draft day', () => {
      const player = {
        name: 'de Gea, David',
        pos: 'GK',
        code: 36,
        club: 'Manchester United',
      };
      teamSeason = new TeamByGameWeek({
        gameWeeks, players: { 'de Gea, David': player }, transfers, draft,
      });
      expect(teamSeason.getTransferList(player)).toEqual([{
        end: endOfSeason,
        start: startOfSeason,
        player,
        playerOut: null,
        type: 'draft',
      }]);
    });

    it('returns a players transfers where dates match the transfer timestamp', () => {
      const player = {
        name: 'de Gea, David',
        pos: 'GK',
        code: 36,
        club: 'Manchester United',
      };
      teamSeason = new TeamByGameWeek({
        gameWeeks,
        players: {
          'de Gea, David': player,
          'Hernandez, Javier': { name: 'Hernandez, Javier' },
        },
        transfers: [{
          ...transfers[0],
          transferOut: 'de Gea, David',
          transferIn: 'Hernandez, Javier',
        }],
        draft,
      });
      expect(teamSeason.getTransferList(player)).toEqual([
        {
          end: new Date(transfers[0].timestamp), player, playerOut: null, start: startOfSeason, type: 'draft',
        },
        {
          end: endOfSeason, player: { name: 'Hernandez, Javier' }, playerOut: player, start: new Date(transfers[0].timestamp), type: 'Transfer',
        },
      ]);
    });

    describe('type swap', () => {
      it('returns a players transfers where dates match the transfer timestamp', () => {
        const player = {
          name: 'de Gea, David',
          pos: 'GK',
          code: 36,
          club: 'Manchester United',
        };
        teamSeason = new TeamByGameWeek({
          gameWeeks,
          players: {
            'de Gea, David': player,
            'another player': { name: 'another player' },
            'Hernandez, Javier': { name: 'Hernandez, Javier' },
          },
          transfers: [{
            ...transfers[0],
            type: 'Swap',
            transferOut: 'Hernandez, Javier',
            transferIn: 'de Gea, David',
          }],
          draft,
        });
        expect(teamSeason.getTransferList(player)).toEqual([
          {
            end: new Date(transfers[0].timestamp), player, playerOut: null, start: startOfSeason, type: 'draft',
          },
          {
            end: endOfSeason, player: { name: 'Hernandez, Javier' }, playerOut: player, start: new Date(transfers[0].timestamp), type: 'Swap',
          },
        ]);
      });
    });
  });

  describe('getSeason', () => {
    it('should return an array of gameWeeks', () => {
      teamSeason = new TeamByGameWeek({
        players, gameWeeks, transfers, draft,
      });
      expect(teamSeason.getSeason()).toHaveLength(gameWeeks.length);
      expect(teamSeason.getSeason()[0]).toHaveProperty('gameWeek', gameWeeksFixture[0].gameWeek);
      expect(teamSeason.getSeason()[0]).toHaveProperty('start', gameWeeksFixture[0].start);
      expect(teamSeason.getSeason()[0]).toHaveProperty('end', gameWeeksFixture[0].end);
    });

    it('should return each gameWeek with an array of team players', () => {
      teamSeason = new TeamByGameWeek({
        players, gameWeeks, transfers, draft,
      });
      expect(teamSeason.getSeason()[0].players).toHaveLength(draft.length);
    });

    it('should return players', () => {
      teamSeason = new TeamByGameWeek({
        players, gameWeeks, transfers, draft,
      });
      expect(teamSeason.getSeason()[0].players[0]).toHaveProperty('name', 'de Gea, David');
      expect(teamSeason.getSeason()[0].players[0]).toHaveProperty('club', 'Manchester United');
      expect(teamSeason.getSeason()[0].players[0]).toHaveProperty('pos', 'GK');
      expect(teamSeason.getSeason()[0].players[0]).toHaveProperty('manager', 'Olly');
      expect(teamSeason.getSeason()[0].players[0]).toHaveProperty('code', 36);
    });
  });
});
