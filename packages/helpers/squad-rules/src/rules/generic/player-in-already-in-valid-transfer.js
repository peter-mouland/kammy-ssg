import { changeTypes } from '../../consts';

export const playerInAlreadyInValidTransfer = (changeState, { transfers }) => {
    if (!changeState.playerIn) return {};
    return {
        error: transfers.find(
            ({ codeIn, type, warnings = [] }) =>
                warnings.length === 0 && codeIn === changeState.playerIn.code && type !== changeTypes.NEW_PLAYER,
        ),
        message: `<strong>${changeState.playerIn.name}</strong> has already been selected by another manager in a pending transfer.`,
    };
};
