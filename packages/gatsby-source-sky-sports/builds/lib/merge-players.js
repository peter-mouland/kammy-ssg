const { playerStats: getPlayerStats } = require('./player-stats');
const logger = require('../../lib/log');

const calculateSeasonStats = (gameWeeksWithFixtures) =>
    gameWeeksWithFixtures.reduce(
        (totals, gw) =>
            Object.keys(gw.stats).reduce(
                (prev, stat) => ({
                    ...prev,
                    [stat]: gw.stats[stat] + (totals[stat] || 0),
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
    const season = calculateSeasonStats(gameWeeksWithFixtures);
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
