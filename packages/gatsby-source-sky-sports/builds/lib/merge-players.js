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
                            : null,
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

const mergePlayers = ({ googlePlayerData, gameWeeks, skyPlayers }) => {
    const gameWeekData = gameWeeks.map(({ data }) => data);
    const skyPlayersObj = skyPlayers.reduce(
        (prev, { data: player }) => ({
            ...prev,
            [player.name]: {
                ...(prev[player.name] || {}),
                ...player,
            },
        }),
        {},
    );
    const googlePlayersObj = googlePlayerData.reduce((prev, googlePlayer) => {
        const player = {
            ...(prev[googlePlayer.Player.trim()] || {}),
            isHidden: ['hidden', 'y', 'Y'].includes(googlePlayer.isHidden),
            new: ['new', 'y', 'Y'].includes(googlePlayer.new),
            code: parseInt(googlePlayer.Code, 10),
            club: googlePlayer.Club,
            pos: googlePlayer.Pos.toUpperCase(), // Pos = dff pos, Position = ss pos
            name: googlePlayer.Player.trim(),
        };
        return {
            ...prev,
            [player.name]: player,
        };
    }, {});
    const mergedPlayers = Object.keys(skyPlayersObj).reduce((prev, playerName) => {
        const gPlayer = googlePlayersObj[playerName] || { new: false, isHidden: true };
        const skyPlayer = skyPlayersObj[playerName] || {};
        const player = {
            isHidden: gPlayer.isHidden,
            new: ['true', true, 'new'].includes(gPlayer.new),
            pos: gPlayer.pos || '',
            club: gPlayer.club || skyPlayer.club,
            fixtures: skyPlayer.fixtures,
            value: skyPlayer.value,
            name: skyPlayer.name,
            code: skyPlayer.code,
            skySportsPosition: skyPlayer.pos,
            isAvailable: skyPlayer.avail === 'Available',
            avail: skyPlayer.avail,
            availStatus: skyPlayer.availStatus,
            availReason: skyPlayer.availReason,
            availNews: skyPlayer.availNews,
            returnDate: skyPlayer.returnDate,
            url: playerName.toLowerCase().trim().replace(/ /g, '-').replace(/,/g, ''),
        };
        const playerWithStats = getPlayerWithStats({ player, gameWeeks: gameWeekData });
        return {
            ...prev,
            [playerName]: playerWithStats,
        };
    }, {});
    logger.error(notFound);
    logger.warn(`GameWeeks without Fixtures: ${notFound.size}`);
    return mergedPlayers;
};

module.exports = mergePlayers;
