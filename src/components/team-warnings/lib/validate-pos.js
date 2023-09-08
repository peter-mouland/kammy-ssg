const validatePosition = (squad = []) =>
    squad.reduce((acc, squadPlayer = {}) => {
        const err =
            squadPlayer.positionId !== squadPlayer.squadPositionId && squadPlayer.squadPositionId !== 'sub'
                ? [squadPlayer.code]
                : [];
        return [...acc, ...err];
    }, []);

const validatePositions = (squads) => {
    const allClubWarnings = squads.reduce((prev, squad) => {
        const errs = validatePosition(squads);
        if (!errs.length) return prev;
        return {
            ...prev,
            [squad.managerId]: errs,
        };
    }, {});
    return allClubWarnings;
};

export default validatePositions;
