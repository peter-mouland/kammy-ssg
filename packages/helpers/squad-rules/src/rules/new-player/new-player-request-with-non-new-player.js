import { changeTypes } from '../../consts';

export const newPlayerRequestWithNonNewPlayer = (changeState) => {
    if (!changeState.playerIn) return {};
    return {
        error: !changeState.playerIn.new && changeState.type === changeTypes.NEW_PLAYER,
        message: `<strong>${changeState.playerIn.name}</strong> is not marked as new. You may need to make a transfer instead`,
    };
};
