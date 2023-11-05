import { changeTypes } from '../../consts';

export const transferWithNewPlayer = (changeState) => {
    if (!changeState.playerIn) return {};
    return {
        error: changeState.playerIn.new && changeState !== changeTypes.NEW_PLAYER,
        message: `<strong>${changeState.playerIn.name}</strong> is marked as 'new'. You may need to make a new player request instead.`,
    };
};
