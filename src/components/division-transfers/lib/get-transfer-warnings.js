import { changeTypes } from './consts';

const managerHasTooManyTransfers = ({ managerTransfers, changeType }) => ({
    error: managerTransfers.length >= 2 && changeType === changeTypes.TRANSFER,
    message: `
        It appears you have already made two <strong>transfers</strong> during this game week,
        so this move may exceed your limit
    `,
});

const managerHasTooManySwaps = ({ managerSwaps, changeType }) => ({
    error: managerSwaps.length >= 2 && changeType === changeTypes.SWAP,
    message: `
        It appears you have already made two <strong>swaps</strong> during this game week,
        so this move may exceed your limit
    `,
});

const newPlayerRequestWithOldPlayer = ({ playerIn, changeType }) => ({
    error: !playerIn.new && changeType === changeTypes.NEW_PLAYER,
    message: `<strong>${playerIn.name}</strong> is not marked as new. You may need to make a transfer instead`,
});

const transferWithNewPlayer = ({ playerIn, changeType }) => ({
    error: playerIn.new && changeType !== changeTypes.NEW_PLAYER,
    message: `<strong>${playerIn.name}</strong> is marked as 'new'. You may need to make a new player request instead.`,
});

const managerHasMoreThanTwoFromOneClub = ({ playerIn, clubPlayers }) => ({
    error: clubPlayers[playerIn.club]?.length > 2,
    message: `
        This transfer appears to make your team exceed the limit of two per club for <strong>${playerIn.club}!</strong>
    `,
});

const playerInOtherTeam = ({ playersInOtherTeamsByName, playerIn, playersInOtherTeams, changeType }) => {
    let message;
    const playerMessage = `It looks like <strong>${playerIn.name}</strong> is already in <strong>${
        playersInOtherTeamsByName[playerIn.name]?.managerName
    }</strong>'s team`;

    if (changeType === changeTypes.NEW_PLAYER) {
        message = `Oops! This player is marked as new but appears to already be in another manager’s team.
         Please submit but check with your friendly admins`;
    } else if (changeType === changeTypes.SWAP) {
        message = `Swaps are for moving players between the SUB spot and their assigned position. ${playerMessage}`;
    } else {
        message = playerMessage;
    }
    return {
        error:
            playersInOtherTeams.includes(playerIn.name) &&
            changeType !== changeTypes.LOAN_END &&
            changeType !== changeTypes.LOAN_START,
        message,
    };
};

const loanPlayerNotInOtherTeam = ({ playerIn, playersInOtherTeams, changeType }) => ({
    error:
        !playersInOtherTeams.includes(playerIn.name) &&
        (changeType === changeTypes.LOAN_END || changeType === changeTypes.LOAN_START),
    message: `
        It looks like <strong>${playerIn.name}</strong> is not in anyone's team. A Loan must involve other managers`,
});

const playerPositionsDontMatch = ({ playerOut, playerIn, teamPLayerOut = {}, changeType }) => ({
    error:
        (changeType === changeTypes.SWAP && playerIn.pos !== playerOut.pos) ||
        (changeType !== changeTypes.SWAP && teamPLayerOut.teamPos !== 'SUB' && playerIn.pos !== playerOut.pos),
    message: `This change appears to put a player in the wrong position within your team!`,
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
    message: `It looks like you're trying to drop a player that is not in your team`,
});

// todo: NEW PLAYER
// - Be warned! If you win this new player, your team may exceed the limit of two per club. You will need to fix this by the next deadline
// - Oops! This player is marked as new but has already been selected by another manager in a pending transfer. Please submit but check with your friendly admins
// - Be warned! If you win this new player, you may be putting him into your team in the wrong position (that’s bad)

// todo : LOAN END
// - The deadline to end loan deals is 24 hours before the weekly transfer deadline. If you end the loan now, this will not take effect until game week commencing {date}
// - This Loan End appears to make your team exceed the limit of two per club. You will need to transfer out or trade a player from that club in order to successfully end this loan deal
// - A player you have selected is not currently on loan. Please ensure you have the correct details, including transaction type.
// - This Loan End appears to put a player into your team in the wrong position. You may need to fix this with your weekly transfers.

// todo : LOANs
// todo (somewhen): know who is on loan
// todo (somewhen): one loan at a time
// todo (somewhen): when loan ends, complete the 'paired' loan agreement too

const getTransferWarnings = ({ playerIn, playerOut, teams, manager, changeType, transfers }) => {
    if (!manager || !playerIn || !playerOut || !changeType) {
        return { warnings: [] };
    }
    const originalTeam = teams[manager];
    const teamPLayerOut = teams[manager].find(({ playerName }) => playerName === playerOut.name);
    const teamPLayerIn = teams[manager].find(({ playerName }) => playerName === playerIn.name);
    const playerInTeamPos = teamPLayerIn ? teamPLayerIn.teamPos : null;
    const playerOutTeamPos = teamPLayerOut ? teamPLayerOut.teamPos : null;

    const newTeam = originalTeam.filter(({ playerName }) => {
        if (changeType === changeTypes.SWAP) {
            return playerName !== playerOut.name && playerName !== playerIn.name;
        } else if (changeType === changeTypes.NEW_PLAYER) {
            return true; // new player should not be assumed to have been won
        }
        return playerName !== playerOut.name;
    });
    if (changeType === changeTypes.SWAP) {
        newTeam.push({
            managerName: manager,
            player: playerOut,
            playerName: playerOut.name,
            pos: playerOut.pos,
            teamPos: playerInTeamPos,
        });
    }
    if (changeType !== changeTypes.NEW_PLAYER) {
        newTeam.push({
            managerName: manager,
            player: playerIn,
            playerName: playerIn.name,
            pos: playerIn.pos,
            teamPos: playerOutTeamPos,
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
        newPlayerRequestWithOldPlayer({ playerIn, changeType }),
        transferWithNewPlayer({ playerIn, changeType }),
        managerHasTooManyTransfers({ managerTransfers, changeType }),
        managerHasTooManySwaps({ managerSwaps, changeType }),
        managerHasMoreThanTwoFromOneClub({ playerIn, clubPlayers }),
        loanPlayerNotInOtherTeam({ playerIn, playersInOtherTeams, playersInOtherTeamsByName }),
        playerInOtherTeam({ playerIn, playersInOtherTeams, playersInOtherTeamsByName, changeType }),
        playerPositionsDontMatch({ playerIn, playerOut, teamPLayerOut, changeType }),
        playerAlreadyInValidTransfer({ playerIn, transfers }),

        // todo: show something to say pending transfer involved has _potential_ issue
        // playerAlreadyInTransferWithWarnings({ playerIn, transfers }),

        // todo: 48 hours from transfer timestamp
        //     - manager facing warning
        //     - admin facing warning comparing 2 transfers with same player
        // playerReTransferredWithinTwoDays({ playerIn, transfers }),
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
