import { changeTypes } from '../../consts';
import { getNewTeam } from '../../utils/get-new-team';

export const loanPlayerNotOwned = (changeState) => {
    if (!changeState.playerOut) return {};
    const { newTeam } = getNewTeam(changeState);
    const playerOutWithinNewTeam = newTeam.find((player) => player.code === changeState.playerOut.code);
    return {
        error: !playerOutWithinNewTeam && changeState.type === changeTypes.LOAN_START,
        message: `It looks like <strong>${changeState.playerOut.name}</strong> is not in your team. A "Loan Start" must involve <em>your</em> players`,
    };
};
