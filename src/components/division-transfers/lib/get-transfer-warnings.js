import { changeTypes } from './consts';

const managerHasTooManyTransfers = ({ managerTransfers, changeType }) => ({
    error: managerTransfers.length >= 2 && changeType === changeTypes.TRANSFER,
    message: `
        It appears you have already made two <strong>transfers</strong> during this game week,
        so this move may exceed your limit
    `,
});

const managerHasTooManySwap = ({ managerSwaps, changeType }) => ({
    error: managerSwaps.length >= 2 && changeType === changeTypes.TRANSFER,
    message: `
        It appears you have already made two <strong>swaps</strong> during this game week,
        so this move may exceed your limit
    `,
});

const newPlayerTransferWithOldPlayer = ({ playerIn, changeType }) => ({
    error: !playerIn.new && changeType === changeTypes.NEW_PLAYER,
    message: `<strong>${playerIn.name}</strong> was transferred as 'new' but he's not new, he's old!`,
});

const transferWithNewPlayer = ({ playerIn, changeType }) => ({
    error: playerIn.new && changeType !== changeTypes.NEW_PLAYER,
    message: `<strong>${playerIn.name}</strong> is marked as 'new'. You may need to make a new player request instead.`,
});

const managerHasMoreThanTwoFromOneClub = ({ playerIn, clubPlayers }) => ({
    error: clubPlayers[playerIn.club].length > 2,
    message: `
        This transfer appears to make your team exceed the limit of two per club for <strong>${playerIn.club}!</strong>
    `,
});

const playerInOtherTeam = ({ playersInOtherTeamsByName, playerIn, playersInOtherTeams }) => ({
    error: playersInOtherTeams.includes(playerIn.name),
    message: `<strong>${playerIn.name}</strong> is already in <strong>${
        playersInOtherTeamsByName[playerIn.name]?.managerName
    }</strong>'s team`,
});

const playerPositionsDontMatch = ({ playerOut, playerIn, teamPLayerOut = {}, changeType }) => ({
    error:
        (changeType === changeTypes.SWAP && playerIn.pos !== playerOut.pos) ||
        (changeType !== changeTypes.SWAP && teamPLayerOut.teamPos !== 'SUB' && playerIn.pos !== playerOut.pos),
    message: `This transfer appears to put a player in the wrong position within your team!`,
});

const playerAlreadyInValidTransfer = ({ transfers, playerIn }) => ({
    error: transfers.find(
        ({ transferIn, type, warnings = [] }) =>
            warnings.length === 0 && transferIn === playerIn.name && type !== changeTypes.NEW_PLAYER,
    ),
    message: `<strong>${playerIn.name}</strong> has already been selected by another manager in a pending transfer.`,
});

const swapInvolvingNonTeamMember = ({ changeType, teamPLayerIn, teamPLayerOut }) => ({
    error: (!teamPLayerIn || !teamPLayerOut) && changeType === changeTypes.SWAP,
    message: `Both players in a swap must be from within your team`,
});

const nonTeamMemberLeaving = ({ changeType, teamPLayerOut }) => ({
    error: !teamPLayerOut && changeType !== changeTypes.SWAP,
    message: `Player leaving must be from within your team`,
});

const getTransferWarnings = ({ playerIn, playerOut, teams, manager, changeType, transfers }) => {
    if (!manager || !playerIn || !playerOut || !changeType) {
        return { warnings: [] };
    }
    const originalTeam = teams[manager];
    const teamPLayerOut = teams[manager].find(({ playerName }) => playerName === playerOut.name);
    const teamPLayerIn = teams[manager].find(({ playerName }) => playerName === playerIn.name);

    const newTeam = originalTeam.filter(({ playerName }) => playerName !== playerOut.name);
    // if not already in the team i.e. swap
    if (!teamPLayerIn) {
        newTeam.push({
            managerName: manager,
            player: playerIn,
            playerName: playerIn.name,
            pos: playerIn.pos,
        });
    }
    const newTeams = { ...teams, [manager]: newTeam };
    const playersInOtherTeamsByName = Object.keys(teams).reduce((prev, managerName) => {
        if (managerName === manager) return prev;
        return {
            ...prev,
            ...teams[managerName].reduce((acc, player) => ({ ...acc, [player.playerName]: player }), {}),
        };
    }, {});
    const playersInOtherTeams = Object.keys(playersInOtherTeamsByName);

    const managerTransfers = transfers.filter(
        ({ manager: managerName, type, warnings = [] }) =>
            managerName === manager && type === changeTypes.TRANSFER && warnings.length === 0,
    );
    const managerSwaps = transfers.filter(
        ({ manager: managerName, type, warnings = [] }) =>
            managerName === manager && type === changeTypes.SWAP && warnings.length === 0,
    );

    const clubPlayers = newTeam.reduce(
        (prev, { player }) => ({
            ...prev,
            [player.club]: [...(prev[player.club] || []), player].filter(Boolean),
        }),
        {},
    );

    const warnings = [
        nonTeamMemberLeaving({ changeType, teamPLayerOut }),
        swapInvolvingNonTeamMember({ changeType, teamPLayerIn, teamPLayerOut }),
        newPlayerTransferWithOldPlayer({ playerIn, changeType }),
        transferWithNewPlayer({ playerIn, changeType }),
        managerHasTooManyTransfers({ managerTransfers, changeType }),
        managerHasTooManySwap({ managerSwaps, changeType }),
        managerHasMoreThanTwoFromOneClub({ playerIn, clubPlayers }),
        playerInOtherTeam({ playerIn, playersInOtherTeams, playersInOtherTeamsByName }),
        playerPositionsDontMatch({ playerIn, playerOut, teamPLayerOut, changeType }),
        playerAlreadyInValidTransfer({ playerIn, transfers }),
    ]
        .filter(({ error }) => !!error)
        .map(({ message }) => message);
    return {
        warnings,
        newTeam: warnings.length ? originalTeam : newTeam,
        newTeams: warnings.length ? teams : newTeams,
    };
};

export default getTransferWarnings;
