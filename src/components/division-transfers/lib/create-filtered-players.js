import sortBy from '@kammy/sort-columns';

import { changeTypes } from './consts';

const positionsOrder = ['GK', 'FB', 'CB', 'MID', 'AM', 'STR', 'SUB'];
const transferToTeam = (transfer) => ({
    manager: transfer.manager,
    club: transfer.clubIn,
    pos: transfer.posIn,
    name: transfer.transferIn,
    isTransfer: true,
    transferStatus: transfer.status,
});

const createFilteredPlayers = ({
    playersArray = [],
    teams = {},
    team = [],
    playerIn,
    playerOut,
    pendingTransfers = [],
    selectedOptions = [],
}) => {
    const selectedPositions = selectedOptions.filter(({ group }) => group === 'position').map(({ value }) => value);
    const selectedManagers = selectedOptions.filter(({ group }) => group === 'manager').map(({ value }) => value);
    const onlyAvailablePlayers = selectedManagers.includes('available');

    const managersPlayers = Object.values(teams)
        .flatMap((name) => name)
        .reduce((prev, curr) => ({ ...prev, [curr.playerName]: curr }), {});

    const selectedManagersPlayers = onlyAvailablePlayers
        ? []
        : selectedManagers
              .map((manager) => teams[manager])
              .flatMap((name) => name)
              .map(({ playerName }) => playerName);

    const pickedPlayers = Object.keys(teams)
        .reduce((prev, curr) => [...prev, ...teams[curr]], [])
        .map(({ playerName }) => playerName);

    const filteredPlayersArray = playersArray.filter(
        ({ pos, name }) =>
            (selectedPositions.includes(pos) || !selectedPositions.length) &&
            (selectedManagersPlayers.includes(name) || !selectedManagersPlayers.length) &&
            ((onlyAvailablePlayers && !pickedPlayers.includes(name)) || !onlyAvailablePlayers),
    );

    const sortedPlayers = filteredPlayersArray.sort(sortBy(['pos', 'name'], { pos: positionsOrder })).map((player) => ({
        ...player,
        manager: managersPlayers[player.playerName] ? managersPlayers[player.playerName].manager : undefined,
        teamPos: managersPlayers[player.playerName] ? managersPlayers[player.playerName].teamPos : undefined,
    }));

    const sortedTeam = team.sort(sortBy(['pos', 'playerName'], { pos: positionsOrder }));
    const teamPlayers = sortedTeam.reduce((prev, curr) => [...prev, curr.playerName], []);
    const nonTeamPlayers = sortedPlayers.filter(({ name }) => !teamPlayers.includes(name));
    const teamPlayersAndRequests = sortedTeam.concat(pendingTransfers.map(transferToTeam));
    const swapOut = sortedTeam.filter(({ teamPos }) => teamPos !== 'SUB');
    const swapIn = sortedTeam.filter(({ teamPos }) => teamPos === 'SUB');
    const playerGaps = sortedPlayers.filter(
        ({ pos, name }) => playerOut && pos === playerOut.pos && !teamPlayers.includes(name),
    );
    const playerDisplacements = teamPlayersAndRequests.filter(({ pos }) => playerIn && pos === playerIn.pos);

    return {
        managersPlayers,
        sortedPlayers,
        sortedTeam,
        teamPlayers,
        nonTeamPlayers,
        teamPlayersAndRequests,
        swapOut,
        swapIn,
        playerGaps,
        playerDisplacements,
        out: {
            [changeTypes.LOAN_START]: teamPlayersAndRequests,
            [changeTypes.LOAN_END]: teamPlayersAndRequests,
            [changeTypes.SWAP]: swapOut,
            [changeTypes.TRADE]: teamPlayersAndRequests,
            [changeTypes.TRANSFER]: teamPlayersAndRequests,
            [changeTypes.NEW_PLAYER]: teamPlayersAndRequests,
            undefined: [],
            null: [],
        },
        in: {
            [changeTypes.LOAN_START]: nonTeamPlayers,
            [changeTypes.LOAN_END]: nonTeamPlayers,
            [changeTypes.SWAP]: swapIn,
            [changeTypes.TRADE]: nonTeamPlayers,
            [changeTypes.TRANSFER]: nonTeamPlayers,
            [changeTypes.NEW_PLAYER]: nonTeamPlayers,
            undefined: [],
            null: [],
        },
        gap: {
            [changeTypes.TRADE]: playerGaps,
            [changeTypes.LOAN_END]: playerGaps,
            [changeTypes.LOAN_START]: playerGaps,
        },
        displaced: {
            [changeTypes.TRADE]: playerDisplacements,
            [changeTypes.LOAN_START]: playerDisplacements,
            [changeTypes.LOAN_END]: playerDisplacements,
        },
    };
};

export default createFilteredPlayers;
