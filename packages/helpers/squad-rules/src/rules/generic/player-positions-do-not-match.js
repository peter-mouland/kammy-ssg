export const playerPositionsDoNotMatch = (changeState) => {
    if (!changeState.playerIn || !changeState.playerOut) return {};
    return {
        error: changeState.playerIn.positionId !== changeState.playerOut.positionId,
        message: `This change appears to put a player in the wrong position within your team!`,
    };
};
