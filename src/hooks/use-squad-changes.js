import { getSquadWarnings, changeTypes } from '@kammy/helpers.squad-rules';
import { getNewTeam } from '@kammy/helpers.squad-rules/src/utils/get-new-team';

import usePlayers from './use-players';
import useGameWeeks from './use-game-weeks';
import useManagers from './use-managers';
import { useTransfersSheet } from './use-google-transfers';

const inDateRange = ({ start, end }, comparison) => comparison < end && comparison > start;

const useSquadChanges = ({ selectedGameWeek, divisionId, Squads = {} }) => {
    const players = usePlayers();
    const managers = useManagers();
    const GameWeeks = useGameWeeks();
    const gameWeek = GameWeeks.getSelectedGameWeek(selectedGameWeek);
    const transfersQuery = useTransfersSheet({ divisionId });

    const transferWithoutWarnings = [];
    let updatedTeams = Squads.byManagerId;
    const changes =
        transfersQuery.data?.map((change) => {
            // divisionData must be in loop to get latest teams with current transfers
            const divisionData = { transfers: transferWithoutWarnings, teamsByManager: updatedTeams };
            // processing this gameWeek also checks previous GW's 'pending' transfers
            // we assume all 'pending' are valid
            const isSelectedGameWeek = selectedGameWeek !== GameWeeks.getGameWeekFromDate(change.timestamp).id;
            if (isSelectedGameWeek && !change.isPending) return change;
            const changeState = {
                type: change.type,
                managerId: change.managerId,
                comment: change.comment,
                isPending: change.isPending,
                playerIn: players.byCode[change.codeIn],
                playerOut: players.byCode[change.codeOut],
            };
            const { warnings } = getSquadWarnings(changeState, divisionData);
            const { teamsWithTransfer } = getNewTeam(changeState, divisionData);
            // if (changeState.managerId === 'tim') {
            //     console.log({ warnings }, teamsWithTransfer['tom-s'], teamsWithTransfer.tim);
            // }
            if (!warnings.length) {
                transferWithoutWarnings.push(change);
            }
            updatedTeams = teamsWithTransfer;
            change.addWarnings(warnings);
            return change;
        }) || [];

    // if pending is slow, update code to use filter-views
    // premierLeague pending transfers filter view id : fvid=305296590
    // championship pending transfers filter view id : fvid=921820010
    // leagueOne pending transfers filter view id : fvid=395776358
    // leagueTwo pending transfers filter view id : fvid=1011473209
    const changesThisGameWeek = changes.filter(({ timestamp }) => inDateRange(gameWeek, timestamp));
    const pendingChanges = changes.filter(({ isPending }) => !!isPending);
    const confirmedChanges = changes.filter(({ isPending }) => !isPending);
    const changesByType = Object.entries(changeTypes).reduce(
        (prev, [key, value]) => ({
            ...prev,
            [key]: changesThisGameWeek.filter(({ type }) => type === value),
        }),
        {},
    );
    return {
        transfersQuery,
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
