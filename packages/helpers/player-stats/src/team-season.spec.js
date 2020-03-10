/* eslint-env jest */
const parse = require('date-fns/parse');

const { TeamSeason, UNKNOWN_PLAYER } = require('./team-season');

let gameWeeks;
let players;
let team;
let teamSeason;
let startOfSeason;
let endOfSeason;

const mockPlayer = require('../fixtures/player.json');
const teamFixture = require('../fixtures/team.json');
const gameWeeksFixture = require('../fixtures/gameweeks.json');

const manager = 'Olly';
const toDate =  (string = '') => {
  if (!string) return string;
  return parse(string);
};


describe('TeamSeason', () => {
  beforeEach(() => {
    team = teamFixture;
    players = {
      ...mockPlayer,
    };
    gameWeeks = gameWeeksFixture.map((gw) => ({ ...gw, players: teamFixture }));
    startOfSeason = toDate(toDate(gameWeeks[0].start).setHours(0, 0, 0, 0));
    endOfSeason = toDate(toDate(gameWeeks[gameWeeks.length - 1].end).setHours(23, 59, 59, 999));
  });

  it('returns data', () => {
    teamSeason = new TeamSeason({
      manager, gameWeeks, players,
    });
    expect(teamSeason).toHaveProperty('startOfSeason', startOfSeason);
    expect(teamSeason).toHaveProperty('endOfSeason', endOfSeason);
    expect(teamSeason).toHaveProperty('gameWeeks', gameWeeks);
    expect(teamSeason).toHaveProperty('getSeason');
    expect(teamSeason).toHaveProperty('players', players);
  });

  describe('getPlayer()', () => {
    beforeEach(() => {
      teamSeason = new TeamSeason({
        manager, gameWeeks, players: { 'de Gea, David': 'found' },
      });
    });

    it('returns a default unknown player is passed', () => {
      expect(teamSeason.getPlayer({ name: '' })).toEqual(UNKNOWN_PLAYER(''));
    });

    it('returns a known player if matched', () => {
      expect(teamSeason.getPlayer({ name: 'de Gea, David' })).toEqual('found');
    });
  });

  describe('getSeason', () => {
    it('should return an array of containing the team', () => {
      teamSeason = new TeamSeason({
        manager, gameWeeks, players,
      });
      expect(teamSeason.getSeason()).toHaveLength(team.length);
    });

    it('should return each team player containing an array of gameWeeks', () => {
      teamSeason = new TeamSeason({
        manager, gameWeeks, players,
      });
      expect(teamSeason.getSeason()[0].gameWeeks).toHaveLength(gameWeeks.length);
    });

    it('should return each team player containing an array of seasonToGameWeek', () => {
      teamSeason = new TeamSeason({
        manager, gameWeeks, players,
      });
      expect(teamSeason.getSeason()[0].seasonToGameWeek).toHaveLength(gameWeeks.length);
    });

    it('should return each team player containing an array of seasonStats', () => {
      teamSeason = new TeamSeason({
        manager, gameWeeks, players,
      });
      expect(teamSeason.getSeason()[0]).toHaveProperty('seasonStats');
    });

    it('should return gameWeeks containing stats', () => {
      teamSeason = new TeamSeason({
        manager, gameWeeks, players,
      });
      expect(teamSeason.getSeason()[0].gameWeeks[0]).toHaveProperty('stats');
      expect(teamSeason.getSeason()[0].gameWeeks[0]).toHaveProperty('gameWeekStats');
      expect(teamSeason.getSeason()[0].gameWeeks[0]).toHaveProperty('name', 'de Gea, David');
      expect(teamSeason.getSeason()[0].gameWeeks[0]).toHaveProperty('pos');
      expect(teamSeason.getSeason()[0].gameWeeks[0]).toHaveProperty('isHidden');
      expect(teamSeason.getSeason()[0].gameWeeks[0]).toHaveProperty('new');
      expect(teamSeason.getSeason()[0].gameWeeks[0]).toHaveProperty('club');
      expect(teamSeason.getSeason()[0].gameWeeks[0]).toHaveProperty('fixtures');
      expect(teamSeason.getSeason()[0].gameWeeks[0]).toHaveProperty('code');
    });
  });
});
