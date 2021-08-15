import { useMutation, useQuery, queryCache } from 'react-query';
import { fetchTransfers, saveTransfers } from '@kammy/helpers.spreadsheet';
import { getSquadWarnings, consts } from '@kammy/helpers.squad-rules';

import useAllTransfers from './use-all-transfers';
import usePlayers from './use-players';
import useGameWeeks from './use-game-weeks';

const inDateRange = ({ start, end }, comparison) => comparison < end && comparison > start;

const fetchr = (key, division = 0) => fetchTransfers(division);

const { changeTypes } = consts;

const useSquadChanges = ({ selectedGameWeek, divisionKey, teamsByManager = {} }) => {
    const queryKey = ['transfers', divisionKey];
    const { isLoading, data: changeData = [] } = useQuery(queryKey, fetchr);
    const alltstuff = useAllTransfers();
    const { players } = usePlayers();
    const playersByName = players.reduce((prev, player) => ({ ...prev, [player.name]: player }), {});
    const transferWithoutWarnings = [];
    let updatedTeams = teamsByManager;
    const [saveSquadChange, { isLoading: isSaving }] = useMutation(saveTransfers, {
        onSuccess: (data) => {
            queryCache.cancelQueries(queryKey);
            queryCache.setQueryData(queryKey, (old) => [...old, ...data]);
        },
    });
    console.log({ alltstuff });
    const { gameWeeks } = useGameWeeks();
    const gameWeek = gameWeeks[selectedGameWeek];
    const applyChange = (changesToApply) =>
        changesToApply.map((change) => {
            if (!change.isPending) {
                // console.log({ change });
                // todo:    add hasBeenBuilt to transfers gra[h
                //          add function to return new-valid-transfers
                // if (change.isValid && !hasBeenBuilt) {
                //
                // }
                return { ...change, warnings: [] };
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
            };
        });
    // console.log(changeData);
    const changes = applyChange(changeData);
    console.log({ changes, gameWeek });
    // if pending is slow, update code to use filter-views
    // premierLeague pending transfers filter view id : fvid=305296590
    // championship pending transfers filter view id : fvid=921820010
    // leagueOne pending transfers filter view id : fvid=395776358
    // leagueTwo pending transfers filter view id : fvid=1011473209
    const changesThisGameWeek = changes.filter(({ timestamp }) => inDateRange(gameWeek, timestamp));
    const pendingChanges = changes.filter(({ isPending }) => !!isPending);
    const confirmedChanges = changes.filter(({ isPending }) => !isPending);
    // console.log({ changesThisGameWeek, pendingChanges, confirmedChanges });
    const changesByType = Object.entries(changeTypes).reduce(
        (prev, [key, value]) => ({
            ...prev,
            [key]: changesThisGameWeek.filter(({ type }) => type === value),
        }),
        {},
    );
    // console.log({ pendingChanges });
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
        changesThisGameWeek,
        changesByType,
    };
};

export default useSquadChanges;
