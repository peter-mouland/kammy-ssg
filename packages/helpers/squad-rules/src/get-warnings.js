import { changeTypes, MAX_PLAYERS_FROM_ONE_CLUB, MAX_TRANSFERS } from './consts';
import maxSwaps from './swaps/max-swaps';

const managerHasTooManyTransfers = ({ managerTransfers, changeType }) => ({
    error: managerTransfers.length >= MAX_TRANSFERS && changeType === changeTypes.TRANSFER,
    message: `
        It appears you have already made two <strong>transfers</strong> during this game week,
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
    error: clubPlayers[playerIn.club]?.length > MAX_PLAYERS_FROM_ONE_CLUB,
    message: `
        This transfer appears to make your team exceed the limit of two per club for <strong>${playerIn.club}!</strong>
    `,
});

const playerInOtherTeam = ({ playersInOtherTeamsByCode, playerIn, playersInOtherTeams, changeType }) => {
    let message;
    const playerMessage = `It looks like <strong>${playerIn.name}</strong> is already in <strong>${
        playersInOtherTeamsByCode[playerIn.code]?.managerName
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
            playersInOtherTeams.includes(playerIn.code) &&
            changeType !== changeTypes.LOAN_END &&
            changeType !== changeTypes.LOAN_START,
        message,
    };
};

const loanPlayerNotInOtherTeam = ({ playerIn, playersInOtherTeams, changeType }) => ({
    error:
        !playersInOtherTeams.includes(playerIn.code) &&
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
            warnings.length === 0 && transferIn === playerIn.code && type !== changeTypes.NEW_PLAYER,
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
// - Be warned! If you win this new player, your team may exceed the limit of two per club.
//      You will need to fix this by the next deadline
// - Oops! This player is marked as new but has already been selected by another manager in a pending transfer.
//      Please submit but check with your friendly admins
// - Be warned! If you win this new player, you may be putting him into your team in the wrong position (that’s bad)

// todo : LOAN END
// - The deadline to end loan deals is 24 hours before the weekly transfer deadline.
//      If you end the loan now, this will not take effect until game week commencing {date}
// - This Loan End appears to make your team exceed the limit of two per club.
//      You will need to transfer out or trade a player from that club in order to successfully end this loan deal
// - A player you have selected is not currently on loan.
//      Please ensure you have the correct details, including transaction type.
// - This Loan End appears to put a player into your team in the wrong position.
//      You may need to fix this with your weekly transfers.

// todo : LOANs
// todo (somewhen): know who is on loan
// todo (somewhen): one loan at a time
// todo (somewhen): when loan ends, complete the 'paired' loan agreement too

const getSquadWarnings = ({ playerIn, playerOut, teams, manager, changeType, transfers }) => {
    if (!manager || !playerIn || !playerOut || !changeType) {
        return { warnings: [] };
    }
    const originalTeam = teams[manager];
    const teamPLayerOut = originalTeam.find(({ player }) => player.code === playerOut.code);
    const teamPLayerIn = originalTeam.find(({ player }) => player.code === playerIn.code);
    const playerInTeamPos = teamPLayerIn ? teamPLayerIn.teamPos : null;
    const playerOutTeamPos = teamPLayerOut ? teamPLayerOut.teamPos : null;

    const newTeam = originalTeam.filter(({ player }) => {
        if (changeType === changeTypes.SWAP) {
            return player.code !== playerOut.code && player.code !== playerIn.code;
        } else if (changeType === changeTypes.NEW_PLAYER) {
            return true; // new player  not be assumed to have been won
        }
        return player.code !== playerOut.code;
    });
    if (changeType === changeTypes.SWAP) {
        newTeam.push({
            managerName: manager,
            posIndex: teamPLayerIn?.posIndex,
            player: playerOut,
            playerCode: playerOut.code,
            pos: playerOut.pos,
            teamPos: playerInTeamPos,
        });
    }
    if (changeType !== changeTypes.NEW_PLAYER) {
        newTeam.push({
            managerName: manager,
            posIndex: teamPLayerOut?.posIndex,
            player: playerIn,
            playerCode: playerIn.code,
            pos: playerIn.pos,
            teamPos: playerOutTeamPos,
        });
    }

    const newTeams = { ...teams, [manager]: newTeam.sort((a, b) => (a.posIndex < b.posIndex ? -1 : 1)) };
    const playersInOtherTeamsByCode = Object.keys(teams).reduce((prev, managerName) => {
        if (managerName === manager) return prev;
        return {
            ...prev,
            ...teams[managerName].reduce((acc, player) => ({ ...acc, [player.player.code]: player }), {}),
        };
    }, {});

    const playersInOtherTeams = Object.keys(playersInOtherTeamsByCode).map((c) => parseInt(c, 10));

    const managerTransfers = transfers.filter(
        ({ manager: managerName, type }) => managerName === manager && type === changeTypes.TRANSFER,
    );
    const managerSwaps = transfers.filter(
        ({ manager: managerName, type }) => managerName === manager && type === changeTypes.SWAP,
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
        changeType === changeTypes.SWAP ? maxSwaps({ managerSwaps }) : {},
        managerHasMoreThanTwoFromOneClub({ playerIn, clubPlayers }),
        loanPlayerNotInOtherTeam({ playerIn, playersInOtherTeams, playersInOtherTeamsByCode }),
        playerInOtherTeam({ playerIn, playersInOtherTeams, playersInOtherTeamsByCode, changeType }),
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
        originalTeam,
        originalTeams: teams,
        warnings,
        transferHasWarnings: !!warnings.length,
        teamWithTransfer: newTeam.sort((a, b) => (a.posIndex < b.posIndex ? -1 : 1)),
        teamsWithTransfer: newTeams,
    };
};

export default getSquadWarnings;
