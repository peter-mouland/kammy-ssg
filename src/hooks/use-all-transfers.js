import parseISO from 'date-fns/parseISO';
import { useQuery } from 'react-query';
import { fetchTransfers } from '@kammy/helpers.spreadsheet';

import useGameWeeks from './use-game-weeks';

const inDateRange = ({ start, end }, comparison) => comparison < parseISO(end) && comparison > parseISO(start);

const fetchr = ({ queryKey }) => fetchTransfers(queryKey[1]);

const useAllTransfers = () => {
    const queryKey1 = ['transfers', 'premierLeague'];
    const queryKey2 = ['transfers', 'championship'];
    const queryKey3 = ['transfers', 'leagueOne'];
    const queryKey4 = ['transfers', 'leagueTwo'];
    const { isLoading: isPremierLeagueLoading, data: premierLeagueTransfers = [] } = useQuery(queryKey1, fetchr);
    const { isLoading: isChampionshipLoading, data: championshipTransfers = [] } = useQuery(queryKey2, fetchr);
    const { isLoading: isLeagueOneLoading, data: leagueOneTransfers = [] } = useQuery(queryKey3, fetchr);
    const { isLoading: isLeagueTwoLoading, data: leagueTwoTransfers = [] } = useQuery(queryKey4, fetchr);
    const isLoading = isPremierLeagueLoading || isChampionshipLoading || isLeagueOneLoading || isLeagueTwoLoading;
    const transfers = [
        ...premierLeagueTransfers,
        ...championshipTransfers,
        ...leagueOneTransfers,
        ...leagueTwoTransfers,
    ];
    const { currentGameWeek } = useGameWeeks();
    const transfersThisGameWeek = transfers.filter((transfer) => inDateRange(currentGameWeek, transfer.timestamp));

    // if pending is slow, update code to use filter-views
    // premierLeague pending transfers filter view id : fvid=305296590
    // championship pending transfers filter view id : fvid=921820010
    // leagueOne pending transfers filter view id : fvid=395776358
    // leagueTwo pending transfers filter view id : fvid=1011473209
    const pendingTransfers = transfers.filter((transfer) => transfer.status === 'TBC');
    const getTransfersThisGameWeekByManager = (managerName) =>
        transfersThisGameWeek.filter(({ manager }) => manager === managerName);
    const getPendingTransfersByManager = (managerName) =>
        pendingTransfers.filter(({ manager }) => manager === managerName);
    const pendingTransfersByManager = pendingTransfers.reduce(
        (prev, curr) => ({
            ...prev,
            [curr.manager]: curr,
        }),
        {},
    );
    return {
        isLoading,
        transfers,
        pendingTransfers,
        pendingTransfersByManager,
        transfersThisGameWeek,
        getTransfersThisGameWeekByManager,
        getPendingTransfersByManager,
    };
};

export default useAllTransfers;
