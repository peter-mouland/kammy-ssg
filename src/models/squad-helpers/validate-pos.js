const validatePosition = (squad = []) =>
    squad.players.reduce((acc, squadPlayer = {}) => {
        const hasError =
            squadPlayer.positionId !== squadPlayer.squadPositionId && squadPlayer.squadPositionId !== 'sub';
        if (hasError) squad.addWarning({ attr: 'position', value: squadPlayer.squadPositionId });
        const err = hasError ? [squadPlayer.code] : [];
        return [...acc, ...err];
    }, []);

const validatePositions = (squads) => {
    const warnings = squads.reduce((prev, squad) => {
        const errs = validatePosition(squad);
        if (!errs.length) return prev;
        return {
            ...prev,
            [squad.managerId]: errs,
        };
    }, {});
    return warnings;
};

export default validatePositions;
