import { MAX_PLAYERS_FROM_ONE_CLUB } from '../../consts';
import { getNewTeam } from '../../utils/get-new-team';

export const moreThanTwoFromOneClub = (changeState) => {
    if (!changeState.playerIn) return {};
    const { newTeam } = getNewTeam(changeState);
    const clubPlayers = newTeam.reduce(
        (prev, player) => ({
            ...prev,
            [player.club]: [...(prev[player.club] || []), player].filter(Boolean),
        }),
        {},
    );
    return {
        error: clubPlayers[changeState.playerIn.club]?.length > MAX_PLAYERS_FROM_ONE_CLUB,
        message: `
        This transfer appears to make your team exceed the limit of two per club for <strong>${changeState.playerIn.club}!</strong>
    `,
    };
};
