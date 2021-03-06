import parseISO from 'date-fns/parseISO';
import { useMutation, useQuery, queryCache } from 'react-query';
import { fetchCup, saveCupTeam } from '@kammy/helpers.spreadsheet';

import useGameWeeks from './use-game-weeks';

const inDateRange = ({ start, end }, comparison) => comparison < parseISO(end) && comparison > parseISO(start);

const fetchr = () => fetchCup();

const useCup = () => {
    const { currentGameWeek } = useGameWeeks();
    const queryKey = ['cup'];
    const { isLoading, data: cupTeams = [] } = useQuery(['cup'], fetchr);
    const metaByManager = cupTeams.reduce(
        (prev, team) => ({
            ...prev,
            [team.manager]: team,
        }),
        {},
    );
    const [saveTeam, { isLoading: isSaving, isSuccess: isSaved }] = useMutation(
        (team) => {
            const teamWithMeta = {
                ...team,
                group: metaByManager[team.manager].group,
                round: metaByManager[team.manager].round,
            };
            return saveCupTeam({ data: [teamWithMeta] });
        },
        {
            onSuccess: (data) => {
                queryCache.cancelQueries(queryKey);
                queryCache.setQueryData(queryKey, (old) => [...old, ...data]);
            },
        },
    );

    const teamsThisGameWeek = cupTeams.filter((team) => inDateRange(currentGameWeek, team.timestamp));

    return {
        queryKey,
        isLoading,
        saveTeam,
        isSaving,
        isSaved,
        cupTeams,
        teamsThisGameWeek,
    };
};

export default useCup;
