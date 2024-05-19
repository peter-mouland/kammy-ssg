const { calculate } = require('@kammy/helpers.fpl-stats-to-points');

const { getPlayerStats } = require('./player-stats');
const logger = require('../../lib/log');

const calculateSeasonStats = (gameWeeksWithFixtures, positionId) =>
    gameWeeksWithFixtures.reduce(
        (totals, gw) =>
            Object.keys(gw.stats || {}).reduce(
                (prev, stat) => ({
                    ...prev,
                    // [stat]: gw.stats[stat] + (totals[stat] || 0),
                    // todo: remove all usages of this method
                    // todo: instead delete the stat from those players that can't earn them
                    [stat]:
                        ['points', 'apps'].includes(stat) || calculate[stat](9, positionId) !== 0
                            ? gw.stats[stat] + (totals[stat] || 0)
                            : 0,
                }),
                {},
            ),
        {},
    );
const notFound = new Set();

const getGameWeeksWithFixtures = ({ player, gameWeeks, fplTeams }) =>
    gameWeeks.map((gw) => {
        const { gameWeekFixtures, gameWeekStats } = getPlayerStats({ player, gameWeek: gw, fplTeams });
        if (!gameWeekFixtures || !gameWeekFixtures.length) {
            notFound.add(gw);
        }
        return { gameWeekIndex: gw.gameWeekIndex, fixtures: gameWeekFixtures, stats: gameWeekStats };
    });

const getPlayerWithStats = ({ player, gameWeeks, fplTeams }) => {
    const gameWeeksWithFixtures = getGameWeeksWithFixtures({ player, gameWeeks, fplTeams });
    const season = calculateSeasonStats(gameWeeksWithFixtures, player.positionId);
    const currentGameWeekIndex = gameWeeks.findIndex(({ isCurrent }) => !!isCurrent);
    const nextGameWeekIndex = currentGameWeekIndex + 1;
    return {
        ...player,
        currentGameWeekFixture: gameWeeksWithFixtures[currentGameWeekIndex],
        gameWeeks: gameWeeksWithFixtures,
        seasonStats: season,
    };
};

const mergePlayers = ({ googlePlayerData, gameWeeks, fplPlayers, fplTeams }) => {
    const gameWeekData = gameWeeks.map(({ data }) => data);
    const googlePlayersObj = googlePlayerData.reduce((prev, googlePlayer) => {
        const code = parseInt(googlePlayer.code, 10);
        if (!googlePlayer.position) {
            // eslint-disable-next-line no-console
            console.error('no position', googlePlayer.name, googlePlayer.code, googlePlayer);
            return prev;
        }
        return {
            ...prev,
            [code]: {
                code,
                isHidden: ['true', true, 'hidden', 'y', 'Y', 'TRUE', 'yes', 'YES'].includes(googlePlayer.isHidden),
                new: ['true', true, 'new', 'y', 'Y', 'TRUE', 'yes', 'YES'].includes(googlePlayer.new),
                positionId: googlePlayer.position?.toLowerCase() || '#N/A',
                club: googlePlayer.team_name,
            },
        };
    }, {});
    const mergedPlayers = fplPlayers.reduce((prev, { data: fplPlayer }) => {
        const gPlayer = googlePlayersObj[fplPlayer.code] || { new: false, isHidden: true, positionId: 'na' };
        if (!googlePlayersObj[fplPlayer.code]) {
            // player is in the fpl list, but not in the google sheet
            logger.warn(`Player not in gsheet? ${fplPlayer.web_name} ${fplPlayer.code}`);
        }
        const player = {
            ...fplPlayer,
            ...gPlayer,
        };
        const playerWithStats = getPlayerWithStats({ player, gameWeeks: gameWeekData, fplTeams });
        return {
            ...prev,
            [fplPlayer.code]: {
                ...playerWithStats,
                name: fplPlayer.web_name,
                url: `/player/${fplPlayer.code}`,
                gameWeekStats: playerWithStats.gameWeek,
            },
        };
    }, {});
    logger.warn(`GameWeeks without Fixtures: ${notFound.size}`);
    return mergedPlayers;
};

module.exports = mergePlayers;
