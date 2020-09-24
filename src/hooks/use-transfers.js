import { useMutation, useQuery, queryCache } from 'react-query';
import { fetchTransfers, saveTransfers } from '@kammy/helpers.spreadsheet';

import useGameWeeks from './use-game-weeks';

const inDateRange = ({ start, end }, comparison) => comparison < end && comparison > start;

const fetchr = (key, division = 0) => fetchTransfers(division);

const useTransfers = ({ selectedGameWeek, divisionKey }) => {
    const queryKey = ['transfers', divisionKey];
    const { isLoading, data: transfers = [] } = useQuery(queryKey, fetchr);

    const [saveTransfer, { isLoading: isSaving }] = useMutation(saveTransfers, {
        onSuccess: (data) => {
            queryCache.cancelQueries(queryKey);
            queryCache.setQueryData(queryKey, (old) => [...old, ...data]);
        },
    });

    const { gameWeeks } = useGameWeeks();
    const gameWeek = gameWeeks[selectedGameWeek];

    const transfersThisGameWeek = transfers.filter((transfer) => inDateRange(gameWeek, transfer.timestamp));

    // if pending is slow, update code to use filter-views
    // premierLeague pending transfers filter view id : fvid=305296590
    // championship pending transfers filter view id : fvid=921820010
    // leagueOne pending transfers filter view id : fvid=395776358
    // leagueTwo pending transfers filter view id : fvid=1011473209
    const pendingTransfers = transfers.filter((transfer) => transfer.status === 'TBC');
    return {
        queryKey,
        isLoading,
        saveTransfer,
        isSaving,
        transfers,
        pendingTransfers,
        transfersThisGameWeek,
    };
};

export default useTransfers;
