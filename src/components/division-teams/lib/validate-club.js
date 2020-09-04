const validateClub = (team = []) =>
    team.reduce(
        (acc, { player } = {}) => {
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

const validateClubs = (teams) => {
    const allClubWarnings = Object.keys(teams)
        .reduce((prev, manager) => {
            const { clubWarnings } = validateClub(teams[manager]);
            if (!clubWarnings.length) return prev
            return {
                ...prev,
                [manager]: clubWarnings,
            };
        }, {})
    return allClubWarnings;
};

export default validateClubs;
