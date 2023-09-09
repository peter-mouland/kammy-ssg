import sortBy from '@kammy/sort-columns';

const positionsOrder = ['gk', 'fb', 'cb', 'mid', 'am', 'str', 'sub'];

const createFilteredPlayers = ({ playersArray = [], teams = {}, selectedOptions = [], transfers }) => {
    const selectedPositions =
        selectedOptions.filter(({ group }) => group === 'position').map(({ value }) => value) || [];

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
        .flatMap((team) => team.players)
        .reduce((prev, curr) => ({ ...prev, [curr.code]: curr }), {});

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
              .flatMap((team) => team.players)
              .map(({ code }) => code)
              .concat(selectedManagersTransfers);

    const unavailablePlayers = Object.keys(teams)
        .reduce((prev, curr) => [...prev, ...teams[curr].players], [])
        .map(({ code }) => code)
        .concat();

    return playersArray
        .filter(
            ({ positionId, new: isNew, code }) =>
                (selectedPositions.includes(positionId) || !selectedPositions.length) &&
                (selectedManagersPlayers.includes(code) || !selectedManagersPlayers.length) &&
                (selectedPlayers.includes(code) || !selectedPlayers.length) &&
                ((includeAvailablePlayers && !unavailablePlayers.includes(code)) || !includeAvailablePlayers) &&
                ((includeNewPlayers && isNew) || !includeNewPlayers) &&
                ((includeSub && managersPlayers[code]?.squadPositionId === 'sub') || !includeSub) &&
                ((includePendingPlayers && (!!transfersInByPlayer[code] || !!transfersOutByPlayer[code])) ||
                    !includePendingPlayers),
        )
        .sort(sortBy(['positionId', 'name'], { positionId: positionsOrder }))
        .map((player) => ({
            ...player,
            isPendingTransferIn: !!transfersInByPlayer[player.code],
            isPendingTransferOut: !!transfersOutByPlayer[player.code],
            managerId: managersPlayers[player.code] ? managersPlayers[player.code].managerId : undefined,
            squadPositionId: managersPlayers[player.code] ? managersPlayers[player.code].squadPositionId : undefined,
        }));
};

export default createFilteredPlayers;
