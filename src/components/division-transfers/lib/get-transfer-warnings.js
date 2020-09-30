const getTransferWarnings = ({ playerIn, playerOut, teams, manager, changeType, transfers }) => {
    const teamPLayerOut = teams[manager].find(({ playerName }) => playerName === playerOut.name);

    const team = teams[manager]
        .filter(({ playerName }) => playerName !== playerOut.name)
        .concat([
            {
                managerName: manager,
                player: playerIn,
                playerName: playerIn.name,
                pos: playerIn.pos,
            },
        ]);
    const managerTransfers = transfers.filter(
        ({ manager: managerName, type }) => managerName === manager && type === 'Transfer',
    );
    const unavailablePlayers = Object.keys(teams).reduce((prev, managerName) => {
        if (managerName === manager) return prev;
        return [...prev, ...teams[managerName].map(({ playerName }) => playerName)];
    }, []);
    const playersInTeams = Object.keys(teams).reduce((prev, managerName) => {
        if (managerName === manager) return prev;
        return {
            ...prev,
            ...teams[managerName].reduce((acc, player) => ({ ...acc, [player.playerName]: player }), {}),
        };
    }, {});

    const clubPlayers = team.reduce(
        (prev, { player }) => ({
            ...prev,
            [player.club]: [...(prev[player.club] || []), player].filter(Boolean),
        }),
        {},
    );

    const playerAlreadyBeingTransferred = transfers.find(({ transferIn }) => transferIn === playerIn.name);
    const moreThanTwoFromClub = clubPlayers[playerIn.club].length > 2 ? playerIn.club : false;
    const playerNotNew = !playerIn.new && changeType === 'New Player' ? playerIn.name : false;
    const playerIsNew = playerIn.new && changeType !== 'New Player' ? playerIn.name : false;
    const playerUnavailable = unavailablePlayers.includes(playerIn.name) ? playerIn.name : false;
    const positionsDontMatch = teamPLayerOut.teamPos !== 'SUB' && playerIn.pos !== playerOut.pos;
    const toManyTransfers = managerTransfers.length >= 2;

    const warnings = [];
    if (playerNotNew) {
        warnings.push(
            `The Player <strong>${playerNotNew}</strong> was transferred as 'new' but he's not new, he's old!`,
        );
    }
    if (playerIsNew) {
        warnings.push(
            `The Player <strong>${playerIsNew}</strong> is marked as 'new'. You may need to make a new player request instead.`,
        );
    }
    if (moreThanTwoFromClub) {
        warnings.push(
            `This transfer appears to make your team exceed the limit of two per club for <strong>${moreThanTwoFromClub}!</strong>`,
        );
    }
    if (playerUnavailable) {
        warnings.push(
            `The player <strong>${playerUnavailable}</strong> is in more than 2 teams (${playersInTeams[playerUnavailable].managerName} has him)!`,
        );
    }
    if (positionsDontMatch) {
        warnings.push(`This transfer appears to put a player in the wrong position within your team!`);
    }
    if (toManyTransfers) {
        warnings.push(
            `It appears you have already made two transfers during this game week, so this move may exceed your limit`,
        );
    }
    if (playerAlreadyBeingTransferred) {
        warnings.push(
            `<strong>${playerIn.name}</strong> has already been selected by another manager in a pending transfer.`,
        );
    }
    return warnings;
};

export default getTransferWarnings;
