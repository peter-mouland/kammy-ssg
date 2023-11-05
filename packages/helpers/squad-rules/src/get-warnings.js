import { getNewTeam } from './utils/get-new-team';
import { transferCountLimit } from './rules/transfer/transfer-count-limit';
import { transferWithNewPlayer } from './rules/transfer/transfer-with-new-player';
import { swapCountLimit } from './rules/swap/swap-count-limit';
import { swapInvolvingMixedPositions } from './rules/swap/swap-involving-mixed-position';
import { swapInvolvingNonTeamMember } from './rules/swap/swap-involving-non-team-member';
import { newPlayerRequestWithNonNewPlayer } from './rules/new-player/new-player-request-with-non-new-player';
import { moreThanTwoFromOneClub } from './rules/generic/more-than-two-players-from-one-club';
import { playerInAlreadyOwned } from './rules/generic/player-in-already-owned';
import { loanPlayerNotOwned } from './rules/loan/loan-player-not-owned';
import { playerOutNotInSquad } from './rules/generic/player-out-not-in-squad';
import { playerPositionsDoNotMatch } from './rules/generic/player-positions-do-not-match';
import { playerInAlreadyInValidTransfer } from './rules/generic/player-in-already-in-valid-transfer';

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

//
// // loans
// const loans = changeState.filter((change) => {
//     if (!playersByCode[change.playerOut].loans) playersByCode[change.playerOut].loans = [];
//     if (!playersByCode[change.playerOut].transfers) playersByCode[change.playerOut].transfers = [];
//
//     if (change.type === 'Loan Start') {
//         const loanStart = {
//             startGameWeek: getGameWeekFromDate(change.date),
//             start: change.date,
//             loanedBy: change.manager,
//         };
//         playersByCode[change.playerOut].loans.push(loanStart);
//     } else if (change.type === 'Loan End') {
//         playersByCode[change.playerOut].loans.at(-1).end = change.date;
//         playersByCode[change.playerOut].loans.at(-1).endGameWeek = getGameWeekFromDate(change.date);
//     } else if (change.type === 'Transfer') {
//         playersByCode[change.playerIn].loans.at(-1).end = change.date;
//         playersByCode[change.playerIn].loans.at(-1).endGameWeek = getGameWeekFromDate(change.date);
//     }
//     return change.type === 'Loan Start' || change.type === 'Loan End';
// });
//
// console.log({ gameWeek });
// console.log({ changeState });
// console.log({ loans });
// console.log({ playersByCode });
// const loanPairings = loans.map((loan) => {
//     // status: (_all_ has 'loan start')
//     // - invalid: has no manager picking up in the same game-week as 'loan start'. not in current game-week
//     // - new loan proposal: has no "loan end", has no manager picking up in the same game-week. in current game week
//     // - new loan accepted: has no "loan end", has manager picking up in the same game-week. in current game week
//     // - on-loan: has no "loan end", has manager picking up in the same game-week. loan not in current game week
//     // - loan end proposal: has manager picking up in the same game-week, has "loan end" in current game week
//     // - loan ended: has manager picking up in the same game-week, has "loan end" in previous game-week
//
//     // class TeamChange {
//     //      category 'Transfer' | 'Loan' | 'Trade' | 'Swap' | 'New Player'
//     //      isPending
//     //      isValid
//     //      isFailed
//     //
//     //      loanStarted
//     //      loanEnded
//     //      player
//     // }
//     // class Player {
//     //      web_name: string
//     //      code: number
//     //      fpl_metrics: { FPLMetrics }
//     //      fixtures: { season: [Fixture], gameWeek: [[Fixture]] }
//     //      stats : { season: Stats, gameWeek: [Stats] }
//     //      club: string
//     //      currentSquad: Manager
//     //      OwnedByManager: Manager
//     // }
//
//     // eslint-disable-next-line no-param-reassign
//     loan.status = '';
//     return loan;
// });

export const getSquadWarnings = (changeState) => {
    const { teamsWithTransfer } = getNewTeam(changeState);

    const warnings = [
        playerInAlreadyOwned(changeState),
        playerOutNotInSquad(changeState),
        swapInvolvingNonTeamMember(changeState),
        swapInvolvingMixedPositions(changeState),
        newPlayerRequestWithNonNewPlayer(changeState),
        transferWithNewPlayer(changeState),
        transferCountLimit(changeState),
        swapCountLimit(changeState),
        moreThanTwoFromOneClub(changeState),
        loanPlayerNotOwned(changeState),
        playerPositionsDoNotMatch(changeState),
        playerInAlreadyInValidTransfer(changeState),

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
        teamsWithTransfer,
    };
};
