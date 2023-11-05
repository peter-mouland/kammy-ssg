import { changeTypes } from '../consts';

export const getNewTeam = (changeState) => {
    console.log({ changeState });
    const { players } = changeState.teamsByManager[changeState.managerId];
    const teamPLayerOut = players.find((player) => player.code === changeState.playerOut?.code);
    const teamPLayerIn = players.find((player) => player.code === changeState.playerIn?.code);
    const playerInSquadPosition = teamPLayerIn ? teamPLayerIn.squadPositionId : null;
    const playerOutSquadPosition = teamPLayerOut ? teamPLayerOut.squadPositionId : null;
    const unsortedTeam = players.filter((player) => {
        if (changeState.type === changeTypes.SWAP) {
            return player.code !== changeState.playerOut.code && player.code !== changeState.playerIn.code;
        } else if (changeState.type === changeTypes.NEW_PLAYER) {
            return true; // new player  not be assumed to have been won
        }
        return player.code !== changeState.playerOut.code;
    });
    if (changeState.type === changeTypes.SWAP) {
        unsortedTeam.push({
            ...changeState.playerOut,
            managerId: changeState.managerId,
            squadPositionIndex: teamPLayerIn?.squadPositionIndex,
            squadPositionId: playerInSquadPosition,
            player: changeState.playerOut,
            playerCode: changeState.playerOut.code,
            playerPositionId: changeState.playerOut.positionId,
        });
    }

    if (changeState.type !== changeTypes.NEW_PLAYER && changeState.playerIn) {
        unsortedTeam.push({
            ...changeState.playerIn,
            managerId: changeState.managerId,
            squadPositionIndex: teamPLayerOut?.squadPositionIndex,
            player: changeState.playerIn,
            playerCode: changeState.playerIn.code,
            playerPositionId: changeState.playerIn.positionId,
            squadPositionId: playerOutSquadPosition,
        });
    }

    const newTeam = unsortedTeam.sort((a, b) => (a.squadPositionIndex < b.squadPositionIndex ? -1 : 1));
    const teamsWithTransfer = {
        ...changeState.teamsByManager,
        [changeState.managerId]: {
            managerId: changeState.managerId,
            players: newTeam, // ".players" needed to mimic teams coming from server
        },
    };

    return { newTeam, teamsWithTransfer };
};
