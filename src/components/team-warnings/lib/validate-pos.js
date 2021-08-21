const validatePosition = (team = []) =>
    team.reduce((acc, item = {}) => {
        const err = item.pos !== item.teamPos && item.teamPos !== 'SUB' ? [item.playerCode] : [];
        return [...acc, ...err];
    }, []);

const validatePositions = (teams) => {
    const allClubWarnings = Object.keys(teams).reduce((prev, manager) => {
        const errs = validatePosition(teams[manager]);
        if (!errs.length) return prev;
        return {
            ...prev,
            [manager]: errs,
        };
    }, {});
    return allClubWarnings;
};

export default validatePositions;
