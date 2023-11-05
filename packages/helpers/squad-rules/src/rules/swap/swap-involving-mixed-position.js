import { changeTypes } from '../../consts';

export const swapInvolvingMixedPositions = (changeState) => {
    if (!changeState.playerOut || changeState.playerIn) return {};
    const { players } = changeState.teamsByManager[changeState.managerId];
    const teamPLayerOut = players.find((player) => player.code === changeState.playerOut?.code);
    const teamPLayerIn = players.find((player) => player.code === changeState.playerIn?.code);

    return {
        error:
            teamPLayerIn &&
            teamPLayerOut &&
            teamPLayerIn.playerPositionId !== teamPLayerOut.playerPositionId &&
            changeState.type === changeTypes.SWAP,
        message: `Both players in a swap must be from the same position`,
    };
};
