export const playerOutNotInSquad = (changeState) => {
    if (!changeState.playerOut) return {};
    const team = changeState.teamsByManager[changeState.managerId];
    const teamPLayerOut = team.players.find((player) => player.code === changeState.playerOut?.code);
    return {
        error: !teamPLayerOut,
        message: `It looks like you're trying to drop a player that is not in your team`,
    };
};
