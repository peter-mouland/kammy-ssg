import { changeTypes } from '../../consts';

export const playerInAlreadyOwned = (changeState, { teamsByManager }) => {
    if (!changeState.playerIn) return {};
    const playersInOtherTeamsByCode = Object.keys(teamsByManager).reduce((prev, managerId) => {
        if (managerId === changeState.managerId) return prev;
        const { players } = teamsByManager[managerId];
        return {
            ...prev,
            ...players.reduce((prevPlayer, player) => ({ ...prevPlayer, [player.code]: player }), {}),
        };
    }, {});

    let message;
    const playerMessage = `It looks like <strong>${changeState.playerIn.name}</strong> is already in <strong>${
        playersInOtherTeamsByCode[changeState.playerIn.code]?.managerId
    }</strong>'s team`;

    if (changeState.type === changeTypes.NEW_PLAYER) {
        message = `Oops! This player is marked as new but appears to already be in another manager’s team.
         Please submit but check with your friendly admins`;
    } else if (changeState.type === changeTypes.SWAP) {
        message = `Swaps are for moving players between the SUB spot and their assigned position. ${playerMessage}`;
    } else {
        message = playerMessage;
    }
    return {
        error:
            playersInOtherTeamsByCode[changeState.playerIn.code] &&
            changeState.type !== changeTypes.LOAN_END &&
            changeState.type !== changeTypes.LOAN_START,
        message,
    };
};
