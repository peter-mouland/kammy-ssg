import { useMutation, useQuery, queryCache } from 'react-query';
import { fetchTransfers, saveTransfers } from '@kammy/helpers.spreadsheet';
import { getSquadWarnings, consts } from '@kammy/helpers.squad-rules';

import usePlayers from './use-players';
import useGameWeeks from './use-game-weeks';
import useMeta from './use-meta';

const inDateRange = ({ start, end }, comparison) => comparison < end && comparison > start;

const fetchr = (key, division = 0) => fetchTransfers(division);

const { changeTypes } = consts;

const useSquadChanges = ({ selectedGameWeek, divisionKey, teamsByManager = {} }) => {
    const queryKey = ['transfers', divisionKey];
    const { isLoading, data: changeData = [] } = useQuery(queryKey, fetchr);
    const { buildTime } = useMeta();
    const { players = [] } = usePlayers();
    const playersByName = players.reduce((prev, player) => ({ ...prev, [player.name]: player }), {});
    const transferWithoutWarnings = [];
    let updatedTeams = teamsByManager;
    const [saveSquadChange, { isLoading: isSaving }] = useMutation(saveTransfers, {
        onSuccess: (data) => {
            queryCache.cancelQueries(queryKey);
            queryCache.setQueryData(queryKey, (old) => [...old, ...data]);
        },
    });
    const { gameWeeks } = useGameWeeks();
    const lastGameWeek = gameWeeks[selectedGameWeek - 1];
    const gameWeek = gameWeeks[selectedGameWeek];

    const applyChange = (changesToApply) =>
        changesToApply.map((change) => {
            const hasBeenBuilt = change.timestamp < buildTime && !change.isPending;
            const changeIsInTheFuture = change.timestamp > gameWeek.start;

            if (!change.isValid || hasBeenBuilt || changeIsInTheFuture) {
                return { ...change, warnings: [], hasBeenBuilt };
            }
            const { transferHasWarnings, warnings, teamsWithTransfer } = getSquadWarnings({
                transfers: transferWithoutWarnings,
                manager: change.manager,
                changeType: change.type,
                playerIn: playersByName[change.transferIn],
                playerOut: playersByName[change.transferOut],
                teams: updatedTeams,
            });
            if (!transferHasWarnings) {
                transferWithoutWarnings.push(change);
            }
            updatedTeams = teamsWithTransfer;
            return {
                ...change,
                warnings,
                hasBeenBuilt,
            };
        });

    const changes = applyChange(changeData);

    // if pending is slow, update code to use filter-views
    // premierLeague pending transfers filter view id : fvid=305296590
    // championship pending transfers filter view id : fvid=921820010
    // leagueOne pending transfers filter view id : fvid=395776358
    // leagueTwo pending transfers filter view id : fvid=1011473209
    const changesApplied = changes.filter(({ timestamp }) => inDateRange(lastGameWeek, timestamp));
    const pendingChanges = changes.filter(({ isPending }) => !!isPending);
    const confirmedChanges = changes.filter(({ isPending }) => !isPending);
    const changesByType = Object.entries(changeTypes).reduce(
        (prev, [key, value]) => ({
            ...prev,
            [key]: changesApplied.filter(({ type }) => type === value),
        }),
        {},
    );

    return {
        queryKey,
        isLoading,
        isSaving,
        saveSquadChange,
        changes,
        newTeams: updatedTeams,
        pendingChanges,
        hasPendingChanges: pendingChanges.length > 0,
        confirmedChanges,
        changesApplied,
        changesByType,
    };
};

export default useSquadChanges;
