import parseISO from 'date-fns/parseISO';
import { useMutation, useQuery, queryCache } from 'react-query';
import { fetchTransfers, saveTransfers } from '@kammy/helpers.spreadsheet';

import useGameWeeks from './use-game-weeks';

const inDateRange = ({ start, end }, comparison) => comparison < parseISO(end) && comparison > parseISO(start);

const fetchr = (key, division = 0) => fetchTransfers(division);

const useTransfers = ({ divisionKey }) => {
    const queryKey = ['transfers', divisionKey];
    const { isLoading, data: transfers = [] } = useQuery(queryKey, fetchr);
    const [saveTransfer, { isLoading: isSaving }] = useMutation(saveTransfers, {
        onSuccess: (data) => {
            queryCache.cancelQueries(queryKey);
            queryCache.setQueryData(queryKey, (old) => [...old, ...data]);
        },
    });
    const { currentGameWeek } = useGameWeeks();
    const limitTransfers = (gw) => transfers.filter((transfer) => inDateRange(gw, transfer.timestamp));
    const showTransfers = limitTransfers(currentGameWeek);
    return {
        queryKey,
        isLoading,
        saveTransfer,
        isSaving,
        transfers,
        transfersThisGameWeek: showTransfers,
    };
};

export default useTransfers;
