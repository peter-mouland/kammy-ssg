export const playerOutNotInSquad = (changeState, { teamsByManager }) => {
    if (!changeState.playerOut) return {};
    const team = teamsByManager[changeState.managerId];
    if (changeState.managerId === 'tony') console.log(changeState.managerId, team.players);
    const teamPLayerOut = team.players.find((player) => player.code === changeState.playerOut?.code);
    return {
        error: !teamPLayerOut,
        message: `It looks like you're trying to drop a player that is not in your team`,
    };
};
