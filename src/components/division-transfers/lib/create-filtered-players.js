import sortBy from '@kammy/sort-columns';

const positionsOrder = ['GK', 'FB', 'CB', 'MID', 'AM', 'STR', 'SUB'];

const createFilteredPlayers = ({ playersArray = [], teams = {}, selectedOptions = [], transfers }) => {
    const selectedPositions =
        selectedOptions?.filter(({ group }) => group === 'position').map(({ value }) => value) || [];
    const selectedManagers =
        selectedOptions?.filter(({ group }) => group === 'manager').map(({ value }) => value) || [];
    const selectedPlayers = selectedOptions?.filter(({ group }) => group === 'player').map(({ value }) => value) || [];
    const selectedMiscOption = selectedOptions?.filter(({ group }) => group === 'misc').map(({ value }) => value) || [];
    const includeAvailablePlayers = selectedManagers?.includes('available');
    const includeNewPlayers = selectedMiscOption?.includes('isNew');
    const includePendingPlayers = selectedMiscOption?.includes('isPending');
    const includeSub = selectedMiscOption?.includes('isSub');

    const transfersByManager = transfers.reduce((prev, transfer) => ({ ...prev, [transfer.manager]: transfer }), {});
    const transfersInByPlayer = transfers.reduce(
        (prev, transfer) => ({ ...prev, [transfer.transferIn]: transfer }),
        {},
    );
    const transfersOutByPlayer = transfers.reduce(
        (prev, transfer) => ({ ...prev, [transfer.transferOut]: transfer }),
        {},
    );

    const managersPlayers = Object.values(teams)
        .flatMap((name) => name)
        .reduce((prev, curr) => ({ ...prev, [curr.playerName]: curr }), {});

    const selectedManagersTransfers = selectedManagers
        .map((manager) => transfersByManager[manager])
        .flatMap((name) => name)
        .filter(Boolean)
        .map(({ transferIn }) => transferIn)
        .concat(
            selectedManagers
                .map((manager) => transfersByManager[manager])
                .flatMap((name) => name)
                .filter(Boolean)
                .map(({ transferOut }) => transferOut),
        );
    const selectedManagersPlayers = includeAvailablePlayers
        ? []
        : selectedManagers
              .map((manager) => teams[manager])
              .flatMap((name) => name)
              .map(({ playerName }) => playerName)
              .concat(selectedManagersTransfers);

    const unavailablePlayers = Object.keys(teams)
        .reduce((prev, curr) => [...prev, ...teams[curr]], [])
        .map(({ playerName }) => playerName)
        .concat();

    return playersArray
        .filter(
            ({ pos, name, new: isNew }) =>
                (selectedPositions.includes(pos) || !selectedPositions.length) &&
                (selectedManagersPlayers.includes(name) || !selectedManagersPlayers.length) &&
                (selectedPlayers.includes(name) || !selectedPlayers.length) &&
                ((includeAvailablePlayers && !unavailablePlayers.includes(name)) || !includeAvailablePlayers) &&
                ((includeNewPlayers && isNew) || !includeNewPlayers) &&
                ((includeSub && managersPlayers[name]?.teamPos === 'SUB') || !includeSub) &&
                ((includePendingPlayers && (!!transfersInByPlayer[name] || !!transfersOutByPlayer[name])) ||
                    !includePendingPlayers),
        )
        .sort(sortBy(['pos', 'name'], { pos: positionsOrder }))
        .map((player) => ({
            ...player,
            isPendingTransferIn: !!transfersInByPlayer[player.name],
            isPendingTransferOut: !!transfersOutByPlayer[player.name],
            manager: managersPlayers[player.name] ? managersPlayers[player.name].managerName : undefined,
            teamPos: managersPlayers[player.name] ? managersPlayers[player.name].teamPos : undefined,
        }));
};

export default createFilteredPlayers;
