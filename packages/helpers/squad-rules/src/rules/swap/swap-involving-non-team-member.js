import { changeTypes } from '../../consts';

export const swapInvolvingNonTeamMember = (changeState) => {
    if (!changeState.playerOut || changeState.playerIn) return {};
    const { players } = changeState.teamsByManager[changeState.managerId];
    const teamPLayerOut = players.find((player) => player.code === changeState.playerOut?.code);
    const teamPLayerIn = players.find((player) => player.code === changeState.playerIn?.code);
    return {
        error: (!teamPLayerIn || !teamPLayerOut) && changeState.type === changeTypes.SWAP,
        message: `Both players in a swap must be from within your team`,
    };
};
