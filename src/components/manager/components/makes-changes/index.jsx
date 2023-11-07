/* eslint-disable react/prop-types */
import React from 'react';
import { changeTypes } from '@kammy/helpers.squad-rules';

import useSquadChanges from '../../../../hooks/use-squad-changes';
import usePlayers from '../../../../hooks/use-players';
import Spacer from '../../../spacer';
import TransfersTable from '../transfers-table';
import PlayersToSwap from '../players-to-swap';
// import PlayersToTransfer from '../players-to-transfer';
// import PlayersToTrade from '../players-to-trade';
// import NewPlayersToTransfer from '../new-players-to-transfer';
import ConfirmChanges from '../confirm-changes';
import SquadOnPitch from '../squad-on-pitch';

const SUB = 'sub';
const CHANGE_TBC = 'TBC';
const CHANGE_CONFIRMED = 'Y';

const selectSquadMember = (squad, squadMember) =>
    squad.map((member) => ({
        ...member,
        isSelected: member.squadPositionIndex === squadMember.squadPositionIndex,
    }));

const createApplySwap =
    ({ newTeam, setNewChanges, newChanges, setNewTeam, managerId, hasPendingChanges }) =>
    ({ type, squadPositionId, player, squadPositionIndex }) => {
        // type === changeTypes.SWAP
        const memberToSwap = newTeam.find((squadMember) => squadMember.player.name === player.name);
        const sub = newTeam.find((squadMember) => squadMember.squadPositionId === SUB);
        const updatedSquad = newTeam.map((squadMember) => {
            if (squadMember.player.name === player.name) {
                return {
                    ...squadMember,
                    squadPositionIndex: sub.squadPositionIndex,
                    squadPositionId: sub.squadPositionId,
                    hasChanged: true,
                };
            } else if (squadMember.squadPositionId === SUB) {
                return {
                    ...squadMember,
                    squadPositionIndex: memberToSwap.squadPositionIndex,
                    squadPositionId: memberToSwap.squadPositionId,
                    hasChanged: true,
                };
            }
            return squadMember;
        });
        setNewChanges([
            ...newChanges,
            {
                manager: managerId,
                status: hasPendingChanges ? CHANGE_TBC : CHANGE_CONFIRMED,
                type: changeTypes.SWAP,
                playerIn: memberToSwap.player,
                playerOut: sub.player,
                transferIn: memberToSwap.player.name,
                transferOut: sub.player.name,
            },
        ]);
        setNewTeam(updatedSquad);
    };

// todo: show next gameweeks team
// todo: but show this gameweeks change-requests

const Manager = ({ managerId, teamsByManager, gameWeekIndex, divisionId }) => {
    const [newChanges, setNewChanges] = React.useState([]);
    const { playersByName } = usePlayers();
    const { changesThisGameWeek, newTeams, changesByType, isLoading, saveSquadChange, hasPendingChanges } =
        useSquadChanges({
            selectedGameWeek: gameWeekIndex, // todo: use separate hook for showing transfers
            divisionId,
            teamsByManager,
        });
    // console.log({ newTeams });

    // const [newTeam, setNewTeam] = React.useState(newTeams[managerId]);
    const [newTeam, setNewTeam] = React.useState(teamsByManager[managerId]);
    const getManagerChanges = (changes) => changes.filter((change) => change.manager === managerId);
    const allManagerChanges = getManagerChanges(changesThisGameWeek);
    const swaps = getManagerChanges(changesByType.SWAP);
    const newSwaps = newChanges.filter(({ type }) => type === changeTypes.SWAP);
    const selectSquadPosition = (squadMember) => setNewTeam(selectSquadMember(newTeam, squadMember));
    const applySwap = createApplySwap({
        newTeam,
        setNewChanges,
        newChanges,
        setNewTeam,
        managerId,
        hasPendingChanges,
    });

    return (
        <Spacer all={{ stack: Spacer.spacings.MEDIUM }}>
            <TransfersTable changes={allManagerChanges} isLoading={isLoading} playersByName={playersByName} />
            <SquadOnPitch squad={newTeam} onSelect={selectSquadPosition} />
            <PlayersToSwap
                applyChange={applySwap}
                swaps={[...swaps, ...newSwaps]}
                saveSquadChange={saveSquadChange}
                team={newTeam}
                teamsByManager={newTeams}
                playersByName={playersByName}
            />
            {/* <PlayersToTransfer*/}
            {/*    selectedPlayers={[]}*/}
            {/*    team={newTeam}*/}
            {/*    teamsByManager={newTeams}*/}
            {/*    playersByName={playersByName}*/}
            {/* />*/}
            {/* <NewPlayersToTransfer*/}
            {/*    selectedPlayers={[]}*/}
            {/*    team={newTeam}*/}
            {/*    teamsByManager={newTeams}*/}
            {/*    playersByName={playersByName}*/}
            {/* />*/}
            {/* <PlayersToTrade*/}
            {/*    selectedPlayers={[]}*/}
            {/*    team={newTeam}*/}
            {/*    teamsByManager={newTeams}*/}
            {/*    playersByName={playersByName}*/}
            {/* />*/}
            <ConfirmChanges
                gameWeek={gameWeekIndex}
                divisionId={divisionId}
                managerId={managerId}
                newChanges={newChanges}
                teamsByManager={teamsByManager}
            />
        </Spacer>
    );
};

export default Manager;
