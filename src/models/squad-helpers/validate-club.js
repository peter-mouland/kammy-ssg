const validateClub = (squad = []) =>
    squad.players.reduce(
        (acc, player) => {
            if (!player) return acc;
            const count = (acc[player.club] || 0) + 1;
            const hasError = count > 2;
            if (hasError) squad.addWarning({ attr: 'club', value: player.club });
            const clubWarnings =
                hasError && acc.clubWarnings.indexOf(player.club) < 0
                    ? [...acc.clubWarnings, player.club]
                    : acc.clubWarnings;
            return {
                ...acc,
                [player.club]: count,
                clubWarnings,
            };
        },
        { clubWarnings: [] },
    );

const validateClubs = (squads) => {
    const allClubWarnings = squads.reduce((prev, squad) => {
        const { clubWarnings } = validateClub(squad);
        if (!clubWarnings.length) return prev;
        return {
            ...prev,
            [squad.managerId]: clubWarnings,
        };
    }, {});
    return allClubWarnings;
};

export default validateClubs;
