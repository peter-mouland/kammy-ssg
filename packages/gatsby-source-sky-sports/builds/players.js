const { playerStats: getPlayerStats } = require('./lib/player-stats');
const { nodeTypes, mediaTypes } = require('../lib/constants');
const logger = require('../lib/log');

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

module.exports = ({ googlePlayerData, gameWeeks, skyPlayers }) => {
    const logEnd = logger.timed('Build: Players');

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
        const player = {
            isHidden: googlePlayersObj[playerName] ? googlePlayersObj[playerName].isHidden : false,
            new: googlePlayersObj[playerName] ? googlePlayersObj[playerName].new : true,
            pos: googlePlayersObj[playerName] ? googlePlayersObj[playerName].pos : '',
            fixtures: skyPlayersObj[playerName].fixtures,
            value: skyPlayersObj[playerName].value,
            name: skyPlayersObj[playerName].name,
            code: skyPlayersObj[playerName].code,
            club: skyPlayersObj[playerName].club,
            skySportsPosition: skyPlayersObj[playerName].pos,
        };
        const playerWithStats = getPlayerWithStats({ player, gameWeeks: gameWeekData });
        return {
            ...prev,
            [playerName]: playerWithStats,
        };
    }, {});

    logEnd();
    logger.error(...notFound);
    logger.warn(`GameWeeks without Fixtures: ${notFound.size}`);
    return Object.values(mergedPlayers).map((player) => ({
        resourceId: `players-${player.name}`,
        data: player,
        internal: {
            description: 'Players',
            mediaType: mediaTypes.JSON,
            type: nodeTypes.players,
        },
    }));
};
