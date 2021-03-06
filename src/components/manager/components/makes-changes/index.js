/* eslint-disable react/prop-types */
import React from 'react';
import { consts } from '@kammy/helpers.squad-rules';

import useSquadChanges from '../../../../hooks/use-squad-changes';
import usePlayers from '../../../../hooks/use-players';
import Spacer from '../../../spacer';
import TransfersTable from '../transfers-table';
import PlayersToSwap from '../players-to-swap';
import PlayersToTransfer from '../players-to-transfer';
import PlayersToTrade from '../players-to-trade';
import NewPlayersToTransfer from '../new-players-to-transfer';
import ConfirmChanges from '../confirm-changes';
import SquadOnPitch from '../squad-on-pitch';

const { SWAP } = consts.changeTypes;
const SUB = 'SUB';
const CHANGE_TBC = 'TBC';
const CHANGE_CONFIRMED = 'Y';

const selectSquadMember = (squad, squadMember) =>
    squad.map((member) => ({
        ...member,
        isSelected: member.posIndex === squadMember.posIndex,
    }));

const createApplySwap = ({ newTeam, setNewChanges, newChanges, setNewTeam, managerName, hasPendingChanges }) => ({
    type,
    teamPos,
    player,
    posIndex,
}) => {
    // type === SWAP
    const memberToSwap = newTeam.find((squadMember) => squadMember.player.name === player.name);
    const sub = newTeam.find((squadMember) => squadMember.teamPos === SUB);
    const updatedSquad = newTeam.map((squadMember) => {
        if (squadMember.player.name === player.name) {
            return {
                ...squadMember,
                posIndex: sub.posIndex,
                teamPos: sub.teamPos,
                hasChanged: true,
            };
        } else if (squadMember.teamPos === SUB) {
            return {
                ...squadMember,
                posIndex: memberToSwap.posIndex,
                teamPos: memberToSwap.teamPos,
                hasChanged: true,
            };
        }
        return squadMember;
    });
    setNewChanges([
        ...newChanges,
        {
            manager: managerName,
            status: hasPendingChanges ? CHANGE_TBC : CHANGE_CONFIRMED,
            type: SWAP,
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

const Manager = ({ managerName, teamsByManager, gameWeek, divisionKey }) => {
    const [newChanges, setNewChanges] = React.useState([]);
    const { playersByName } = usePlayers();
    const {
        changesThisGameWeek,
        newTeams,
        changesByType,
        isLoading,
        saveSquadChange,
        hasPendingChanges,
    } = useSquadChanges({
        selectedGameWeek: gameWeek, // todo: use separate hook for showing transfers
        divisionKey,
        teamsByManager,
    });
    // console.log({ newTeams });

    const [newTeam, setNewTeam] = React.useState(newTeams[managerName]);
    const getManagerChanges = (changes) => changes.filter((change) => change.manager === managerName);
    const allManagerChanges = getManagerChanges(changesThisGameWeek);
    const swaps = getManagerChanges(changesByType.SWAP);
    const newSwaps = newChanges.filter(({ type }) => type === SWAP);
    const selectSquadPosition = (squadMember) => setNewTeam(selectSquadMember(newTeam, squadMember));
    const applySwap = createApplySwap({
        newTeam,
        setNewChanges,
        newChanges,
        setNewTeam,
        managerName,
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
                gameWeek={gameWeek}
                divisionKey={divisionKey}
                managerName={managerName}
                newChanges={newChanges}
                teamsByManager={teamsByManager}
            />
        </Spacer>
    );
};

export default Manager;
