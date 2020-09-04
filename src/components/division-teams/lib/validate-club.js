const validateClub = (team = [], intGameWeek) => {
    const players = team
        .map((teamSheetItem) => teamSheetItem.gameWeeks[intGameWeek])
        .filter(Boolean)
        .filter(({ club }) => !!club);
    return players.reduce(
        (acc, player = {}) => {
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
};

export default validateClub;
