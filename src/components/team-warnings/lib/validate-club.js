const validateClub = (squad = []) =>
    squad.reduce(
        (acc, player) => {
            if (!player) return acc;
            const count = (acc[player.club] || 0) + 1;
            const clubWarnings =
                count > 2 && acc.clubWarnings.indexOf(player.club) < 0
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
        const { clubWarnings } = validateClub(squad.players);
        if (!clubWarnings.length) return prev;
        return {
            ...prev,
            [squad.managerId]: clubWarnings,
        };
    }, {});
    return allClubWarnings;
};

export default validateClubs;
