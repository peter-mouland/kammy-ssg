import { changeTypes } from '../../consts';
import { playerOutNotInSquad } from './player-out-not-in-squad';

export const playerPositionsDoNotMatch = (changeState, { teamsByManager }) => {
    if (!changeState.playerIn || !changeState.playerOut) return {};
    const squadPlayerOut = teamsByManager[changeState.managerId].players.find(
        (squadPLayer) => squadPLayer.code === changeState.playerOut.code,
    );
    if (squadPlayerOut.squadPositionId === 'sub') return {};
    return {
        error: changeState.playerIn.positionId !== changeState.playerOut.positionId,
        message: `This change appears to put a player in the wrong position within your team!`,
    };
};
