import parseISO from 'date-fns/parseISO';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCup, saveCupTeam } from '@kammy/helpers.spreadsheet';

import useGameWeeks from './use-game-weeks';

const inDateRange = ({ start, end }, comparison) => comparison < parseISO(end) && comparison > parseISO(start);

const fetchr = () => fetchCup();

const useCup = () => {
    const queryClient = useQueryClient();
    const { currentGameWeek } = useGameWeeks();
    const queryKey = ['cup'];
    const { isLoading, data: cupTeams = [] } = useQuery({ queryKey, queryFn: fetchr });
    const metaByManager = cupTeams.reduce(
        (prev, team) => ({
            ...prev,
            [team.manager]: team,
        }),
        {},
    );
    const {
        mutate: saveTeam,
        isPending: isSaving,
        isSuccess: isSaved,
    } = useMutation({
        mutationFn: (team) => {
            const teamWithMeta = {
                ...team,
                group: metaByManager[team.manager].group,
                round: metaByManager[team.manager].round,
            };
            return saveCupTeam({ data: [teamWithMeta] });
        },
        onSuccess: async (data) => {
            await queryClient.cancelQueries(queryKey);
            queryClient.setQueryData(queryKey, (old) => [...old, ...data]);
        },
    });

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
