const { calculateTotalPoints } = require('@kammy/helpers.sky-sports-stats-to-points');

const { playerStats: getPlayerStats } = require('./player-stats');
const logger = require('../../lib/log');

const calculateSeasonStats = (gameWeeksWithFixtures, pos) =>
    gameWeeksWithFixtures.reduce(
        (totals, gw) =>
            Object.keys(gw.stats).reduce(
                (prev, stat) => ({
                    ...prev,
                    // [stat]: gw.stats[stat] + (totals[stat] || 0),
                    // todo: remove all usages of this method
                    // todo: instead delete the stat from thos players that can't earn them
                    [stat]:
                        stat === 'points' || calculateTotalPoints({ stats: { [stat]: 9 }, pos }).total !== 0
                            ? gw.stats[stat] + (totals[stat] || 0)
                            : 0,
                }),
                {},
            ),
        {},
    );
const notFound = new Set();

const getGameWeeksWithFixtures = ({ player, gameWeeks }) =>
    gameWeeks.map((gw) => {
        const { gameWeekFixtures, gameWeekStats } = getPlayerStats({ player, gameWeeks: [gw] });
        if (!gameWeekFixtures || !gameWeekFixtures.length) {
            notFound.add(gw);
        }
        return { fixtures: gameWeekFixtures, stats: gameWeekStats };
    });

const getPlayerWithStats = ({ player, gameWeeks }) => {
    const gameWeeksWithFixtures = getGameWeeksWithFixtures({ player, gameWeeks });
    const season = calculateSeasonStats(gameWeeksWithFixtures, player.pos);
    return {
        ...player,
        gameWeeks: gameWeeksWithFixtures,
        season,
    };
};

const mergePlayers = ({ googlePlayerData, gameWeeks, fplPlayers }) => {
    const gameWeekData = gameWeeks.map(({ data }) => data);
    const googlePlayersObj = googlePlayerData.reduce((prev, googlePlayer) => {
        const code = parseInt(googlePlayer.code, 10);
        return {
            ...prev,
            [code]: {
                code,
                isHidden: ['true', true, 'hidden', 'y', 'Y', 'TRUE', 'yes', 'YES'].includes(googlePlayer.isHidden),
                new: ['true', true, 'new', 'y', 'Y', 'TRUE', 'yes', 'YES'].includes(googlePlayer.new),
                pos: googlePlayer.position.toUpperCase() || '#N/A', // Pos = dff pos, Position = ss pos
                club: googlePlayer.team_name,
            },
        };
    }, {});
    const mergedPlayers = fplPlayers.reduce((prev, { data: fplPlayer }) => {
        const gPlayer = googlePlayersObj[fplPlayer.code] || { new: false, isHidden: true, pos: '#N/A' };
        if (!googlePlayersObj[fplPlayer.code]) {
            console.log(fplPlayer);
            logger.error('What player?');
        }
        const player = {
            ...fplPlayer,
            ...gPlayer,
            isAvailable: ['null', null].includes(fplPlayer.chance_of_playing_next_round),
            avail: fplPlayer.avail || '',
            availStatus: fplPlayer.availStatus || '', // todo: fpl equivalent?
            availReason: fplPlayer.availReason || '',
            availNews: fplPlayer.availNews || '',
            returnDate: fplPlayer.returnDate || '',
            url: `/player/${gPlayer.code}`,
        };
        const playerWithStats = getPlayerWithStats({ player, gameWeeks: gameWeekData });
        return {
            ...prev,
            [fplPlayer.code]: playerWithStats,
        };
    }, {});
    logger.error(notFound);
    logger.warn(`GameWeeks without Fixtures: ${notFound.size}`);
    return mergedPlayers;
};

module.exports = mergePlayers;
