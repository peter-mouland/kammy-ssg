import parseISO from 'date-fns/parseISO';
import { useMutation, useQuery, queryCache } from 'react-query';
import { fetchCup, saveCupTeam } from '@kammy/helpers.spreadsheet';

import useGameWeeks from './use-game-weeks';

const inDateRange = ({ start, end }, comparison) => comparison < parseISO(end) && comparison > parseISO(start);

const fetchr = () => fetchCup();

const useCup = () => {
    const queryKey = ['cup'];
    const { isLoading, data: cupTeams = [] } = useQuery(['cup'], fetchr);

    const [saveTeam, { isLoading: isSaving }] = useMutation(saveCupTeam, {
        onSuccess: (data) => {
            queryCache.cancelQueries(queryKey);
            queryCache.setQueryData(queryKey, (old) => [...old, ...data]);
        },
    });

    const { currentGameWeek } = useGameWeeks();
    const teamsThisGameWeek = cupTeams.filter((team) => inDateRange(currentGameWeek, team.timestamp));

    return {
        queryKey,
        isLoading,
        saveTeam,
        isSaving,
        cupTeams,
        teamsThisGameWeek,
    };
};

export default useCup;
