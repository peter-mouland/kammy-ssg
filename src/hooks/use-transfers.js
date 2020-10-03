import { useMutation, useQuery, queryCache } from 'react-query';
import { fetchTransfers, saveTransfers } from '@kammy/helpers.spreadsheet';

import usePlayers from './use-players';
import useGameWeeks from './use-game-weeks';
import getTransferWarnings from '../components/division-transfers/lib/get-transfer-warnings';

const inDateRange = ({ start, end }, comparison) => comparison < end && comparison > start;

const fetchr = (key, division = 0) => fetchTransfers(division);

const useTransfers = ({ selectedGameWeek, divisionKey, teamsByManager }) => {
    const queryKey = ['transfers', divisionKey];
    const { isLoading, data: transfers = [] } = useQuery(queryKey, fetchr);
    const { players } = usePlayers();
    const playersByName = players.reduce((prev, player) => ({ ...prev, [player.name]: player }), {});
    const transferWithoutWarnings = [];
    let teamsWithoutWarnings = teamsByManager;

    const [saveTransfer, { isLoading: isSaving }] = useMutation(saveTransfers, {
        onSuccess: (data) => {
            queryCache.cancelQueries(queryKey);
            queryCache.setQueryData(queryKey, (old) => [...old, ...data]);
        },
    });

    const { gameWeeks } = useGameWeeks();
    const gameWeek = gameWeeks[selectedGameWeek];
    const transfersWithWarnings = transfers.map((transfer) => {
        if (!transfer.isPending) {
            return { ...transfer, warnings: [] };
        }
        const { warnings = [], newTeams = teamsByManager } = getTransferWarnings({
            transfers: transferWithoutWarnings,
            manager: transfer.manager,
            changeType: transfer.type,
            playerIn: playersByName[transfer.transferIn],
            playerOut: playersByName[transfer.transferOut],
            teams: teamsWithoutWarnings,
        });
        if (!warnings.length) {
            transferWithoutWarnings.push(transfer);
            teamsWithoutWarnings = newTeams;
        }
        return {
            ...transfer,
            warnings,
        };
    });

    // if pending is slow, update code to use filter-views
    // premierLeague pending transfers filter view id : fvid=305296590
    // championship pending transfers filter view id : fvid=921820010
    // leagueOne pending transfers filter view id : fvid=395776358
    // leagueTwo pending transfers filter view id : fvid=1011473209
    const transfersThisGameWeek = transfersWithWarnings.filter(({ timestamp }) => inDateRange(gameWeek, timestamp));
    const pendingTransfers = transfersWithWarnings.filter(({ isPending }) => !!isPending);
    const confirmedTransfers = transfersWithWarnings.filter(({ isPending }) => !isPending);
    return {
        queryKey,
        isLoading,
        saveTransfer,
        isSaving,
        transfers: transfersWithWarnings,
        teamsWithoutWarnings,
        pendingTransfers,
        confirmedTransfers,
        transfersThisGameWeek,
    };
};

export default useTransfers;
