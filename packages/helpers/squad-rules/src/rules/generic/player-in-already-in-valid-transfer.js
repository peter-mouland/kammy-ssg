import { changeTypes } from '../../consts';

export const playerInAlreadyInValidTransfer = (changeState) => {
    if (!changeState.playerIn) return {};
    return {
        error: changeState.transfers.find(
            ({ transferIn, type, warnings = [] }) =>
                warnings.length === 0 && transferIn === changeState.playerIn.code && type !== changeTypes.NEW_PLAYER,
        ),
        message: `<strong>${changeState.playerIn.name}</strong> has already been selected by another manager in a pending transfer.`,
    };
};
